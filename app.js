// Enhanced Kubernetes Dashboard JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const namespaceDropdown = document.getElementById("namespace-dropdown");
  const autoRefreshToggle = document.getElementById("autoRefreshToggle");
  const refreshButton = document.getElementById("refreshButton");
  const healthCheckButton = document.getElementById("healthCheckButton");
  const healthCheckResult = document.getElementById("healthCheckResult");
  const apiServerStatus = document.getElementById("apiServerStatus");
  const schedulerStatus = document.getElementById("schedulerStatus");
  const controllerStatus = document.getElementById("controllerStatus");
  const scanForm = document.getElementById("scanForm");
  const imageInput = document.getElementById("imageInput");
  const scanResults = document.getElementById("scanResults");
  const scanSummary = document.getElementById("scanSummary");
  const exportScanResults = document.getElementById("exportScanResults");
  const podSelector = document.getElementById("podSelector");
  const logsOutput = document.getElementById("logsOutput");
  const logsFilter = document.getElementById("logsFilter");
  const refreshLogs = document.getElementById("refreshLogs");
  const podsRunningCount = document.getElementById("podsRunningCount");
  const podsPendingCount = document.getElementById("podsPendingCount");
  const podsFailedCount = document.getElementById("podsFailedCount");

  // Global state
  let defaultNamespace = "default";
  let autoRefreshInterval = null;
  let currentPodLogs = "";
  let refreshTimeout = null;
  let retryAttempts = 0;
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000; // 1 second
  
  // Cache for API responses
  const cache = {
    systemInfo: { data: null, timestamp: 0, ttl: 5000 }, // 5 seconds
    namespaces: { data: null, timestamp: 0, ttl: 30000 }, // 30 seconds
    kubernetesInfo: { data: null, timestamp: 0, ttl: 10000 }, // 10 seconds
    podStatuses: { data: null, timestamp: 0, ttl: 10000 }, // 10 seconds
  };
  
  // Cache utility functions
  function getCachedData(key) {
    const cached = cache[key];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }
  
  function setCachedData(key, data) {
    cache[key] = {
      data: data,
      timestamp: Date.now(),
      ttl: cache[key].ttl
    };
  }

  // Cleanup function for intervals and timeouts
  function cleanup() {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
  }

  // Add cleanup on page unload
  window.addEventListener('beforeunload', cleanup);

  // Enhanced error handling utility
  async function fetchWithRetry(url, options = {}, retries = MAX_RETRY_ATTEMPTS) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      retryAttempts = 0; // Reset on successful request
      return await response.json();
    } catch (error) {
      if (retries > 0) {
        retryAttempts++;
        console.warn(`Request failed, retrying in ${RETRY_DELAY * retryAttempts}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryAttempts));
        return fetchWithRetry(url, options, retries - 1);
      }
      console.error(`Request failed after ${MAX_RETRY_ATTEMPTS} attempts:`, error);
      throw new Error(`Failed after ${MAX_RETRY_ATTEMPTS} attempts: ${error.message}`);
    }
  }

  // Enhanced error display utility
  function displayError(error, context = '') {
    console.error(`Error ${context}:`, error);
    const errorMessage = error.message || 'An unexpected error occurred';
    showNotification(`${context ? context + ': ' : ''}${errorMessage}`, 'error');
  }

  // Chart objects container
  window.charts = {};

  // Colors
  const chartColors = {
    cpu: "#3498db",
    memory: "#2ecc71",
    storage: "#9b59b6",
    pod: {
      running: "#2ecc71",
      pending: "#f39c12",
      failed: "#e74c3c",
      unknown: "#95a5a6",
    },
  };

  // ========== Initial Setup ==========
  initializeDashboard();

  function initializeDashboard() {
    // Setup event listeners
    if (scanForm) scanForm.addEventListener("submit", handleImageScan);
    if (healthCheckButton)
      healthCheckButton.addEventListener("click", handleHealthCheck);
    if (namespaceDropdown)
      namespaceDropdown.addEventListener("change", handleNamespaceChange);
    if (autoRefreshToggle)
      autoRefreshToggle.addEventListener("change", toggleAutoRefresh);
    if (refreshButton) refreshButton.addEventListener("click", manualRefresh);
    if (exportScanResults)
      exportScanResults.addEventListener("click", exportScanResultsToFile);
    if (podSelector) podSelector.addEventListener("change", fetchPodLogs);
    if (refreshLogs) refreshLogs.addEventListener("click", refreshPodLogs);
    if (logsFilter) logsFilter.addEventListener("input", filterLogs);

    // Initialize charts
    initializeCharts();

    // Add keyboard navigation
    initializeKeyboardNavigation();

    // First update
    updateDashboard();
  }

  // Keyboard navigation support
  function initializeKeyboardNavigation() {
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Make focusable elements more visible
    const focusableElements = document.querySelectorAll('button, input, select, a');
    focusableElements.forEach(element => {
      element.addEventListener('focus', () => {
        element.style.outline = '2px solid var(--light-accent)';
        element.style.outlineOffset = '2px';
      });
      element.addEventListener('blur', () => {
        element.style.outline = 'none';
      });
    });
  }

  function handleKeyboardNavigation(event) {
    // Handle Escape key to close modals/notifications
    if (event.key === 'Escape') {
      const notifications = document.querySelectorAll('.notification');
      notifications.forEach(notification => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      });
    }
    
    // Handle Enter key on buttons
    if (event.key === 'Enter' && event.target.tagName === 'BUTTON') {
      event.target.click();
    }
    
    // Handle Space key on buttons
    if (event.key === ' ' && event.target.tagName === 'BUTTON') {
      event.preventDefault();
      event.target.click();
    }
    
    // Handle Tab navigation improvements
    if (event.key === 'Tab') {
      const focusableElements = document.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  // ========== Chart Initialization ==========
  function initializeCharts() {
    // Initialize CPU Chart
    const cpuCtx = document.getElementById("cpuChart")?.getContext("2d");
    if (cpuCtx) {
      window.charts.cpu = new Chart(cpuCtx, {
        type: "line",
        data: {
          labels: Array(10).fill(""),
          datasets: [
            {
              label: "CPU Usage (%)",
              data: Array(10).fill(null),
              borderColor: chartColors.cpu,
              backgroundColor: hexToRgba(chartColors.cpu, 0.2),
              borderWidth: 2,
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: getChartOptions("CPU Usage"),
      });
    }

    // Initialize Memory Chart
    const memoryCtx = document.getElementById("memoryChart")?.getContext("2d");
    if (memoryCtx) {
      window.charts.memory = new Chart(memoryCtx, {
        type: "line",
        data: {
          labels: Array(10).fill(""),
          datasets: [
            {
              label: "Memory Usage (%)",
              data: Array(10).fill(null),
              borderColor: chartColors.memory,
              backgroundColor: hexToRgba(chartColors.memory, 0.2),
              borderWidth: 2,
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: getChartOptions("Memory Usage"),
      });
    }

    // Initialize Storage Chart
    const storageCtx = document
      .getElementById("storageChart")
      ?.getContext("2d");
    if (storageCtx) {
      window.charts.storage = new Chart(storageCtx, {
        type: "line",
        data: {
          labels: Array(10).fill(""),
          datasets: [
            {
              label: "Storage Usage (%)",
              data: Array(10).fill(null),
              borderColor: chartColors.storage,
              backgroundColor: hexToRgba(chartColors.storage, 0.2),
              borderWidth: 2,
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: getChartOptions("Storage Usage"),
      });
    }

    // Initialize Pod Status Chart
    const podStatusCtx = document
      .getElementById("podStatusChart")
      ?.getContext("2d");
    if (podStatusCtx) {
      window.podStatusChart = new Chart(podStatusCtx, {
        type: "doughnut",
        data: {
          labels: ["Running", "Pending", "Failed"],
          datasets: [
            {
              data: [0, 0, 0],
              backgroundColor: [
                chartColors.pod.running,
                chartColors.pod.pending,
                chartColors.pod.failed,
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: {
                font: {
                  size: 12,
                },
              },
            },
          },
        },
      });
    }
  }

  function getChartOptions(title) {
    const isDarkMode = document.body.className === "dark-theme";
    const textColor = isDarkMode ? "#e2e8f0" : "#2c3e50";
    const gridColor = isDarkMode
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.1)";

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: textColor,
            callback: function (value) {
              return value + "%";
            },
          },
          grid: {
            color: gridColor,
          },
        },
        x: {
          ticks: {
            color: textColor,
            maxRotation: 0,
          },
          grid: {
            color: gridColor,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: isDarkMode ? "#2c3039" : "rgba(255, 255, 255, 0.9)",
          titleColor: isDarkMode ? "#e2e8f0" : "#2c3e50",
          bodyColor: isDarkMode ? "#e2e8f0" : "#2c3e50",
          borderColor: isDarkMode ? "#3d4352" : "#e2e8f0",
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            label: function (context) {
              return `${title}: ${context.raw}%`;
            },
            afterLabel: function(context) {
              const value = context.raw;
              if (value > 80) return "⚠️ High usage";
              if (value > 60) return "⚡ Moderate usage";
              return "✅ Normal usage";
            }
          },
        },
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 8,
        },
        line: {
          borderWidth: 2,
        }
      },
    };
  }

  // ========== Event Handlers ==========
  function handleImageScan(event) {
    event.preventDefault();
    const imageName = imageInput.value.trim();
    
    // Input validation and sanitization
    if (!imageName) {
      showNotification("Please enter a Docker image name", "error");
      return;
    }
    
    // Validate image name format (basic validation)
    const imageNamePattern = /^[a-zA-Z0-9._/-]+(:[a-zA-Z0-9._-]+)?$/;
    if (!imageNamePattern.test(imageName)) {
      showNotification("Invalid image name format. Use format: repository/image:tag", "error");
      return;
    }
    
    // Sanitize input to prevent XSS
    const sanitizedImageName = imageName.replace(/[<>\"']/g, '');
    if (sanitizedImageName !== imageName) {
      showNotification("Invalid characters detected in image name", "error");
      return;
    }

    showNotification(`Scanning image: ${sanitizedImageName}`, "info");
    scanResults.textContent = "Scanning...";

    // Reset vulnerability counts
    document.querySelectorAll(".vuln-count .count").forEach((el) => {
      el.textContent = "-";
    });

    scanImage(sanitizedImageName);
  }

  function handleHealthCheck() {
    healthCheckResult.innerHTML =
      '<span class="status-text">Checking...</span>';
    healthCheckResult.className = "health-status-indicator";

    apiServerStatus.textContent = "Checking...";
    schedulerStatus.textContent = "Checking...";
    controllerStatus.textContent = "Checking...";

    fetch("http://127.0.0.1:5000/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          // Randomly simulate component statuses for demo purposes
          const components = {
            apiServer: Math.random() > 0.1,
            scheduler: Math.random() > 0.1,
            controller: Math.random() > 0.1,
          };

          apiServerStatus.textContent = components.apiServer
            ? "Online"
            : "Offline";
          apiServerStatus.className =
            "metric-value " + (components.apiServer ? "online" : "offline");

          schedulerStatus.textContent = components.scheduler
            ? "Online"
            : "Offline";
          schedulerStatus.className =
            "metric-value " + (components.scheduler ? "online" : "offline");

          controllerStatus.textContent = components.controller
            ? "Online"
            : "Offline";
          controllerStatus.className =
            "metric-value " + (components.controller ? "online" : "offline");

          const allHealthy = Object.values(components).every((c) => c);

          if (allHealthy) {
            healthCheckResult.className = "health-status-indicator healthy";
            healthCheckResult.innerHTML =
              '<span class="status-text">Healthy</span>';
            showNotification(
              "Cluster health check completed: Healthy",
              "success",
            );
          } else if (Object.values(components).some((c) => c)) {
            healthCheckResult.className = "health-status-indicator warning";
            healthCheckResult.innerHTML =
              '<span class="status-text">Degraded</span>';
            showNotification(
              "Cluster health check completed: Degraded",
              "warning",
            );
          } else {
            healthCheckResult.className = "health-status-indicator unhealthy";
            healthCheckResult.innerHTML =
              '<span class="status-text">Unhealthy</span>';
            showNotification(
              "Cluster health check completed: Unhealthy",
              "error",
            );
          }
        }
      })
      .catch((err) => {
        console.error("❌ Health check failed:", err);
        healthCheckResult.className = "health-status-indicator unhealthy";
        healthCheckResult.innerHTML = '<span class="status-text">Error</span>';

        apiServerStatus.textContent = "Unknown";
        schedulerStatus.textContent = "Unknown";
        controllerStatus.textContent = "Unknown";

        showNotification("Health check failed", "error");
      });
  }

  function handleNamespaceChange() {
    const selectedNamespace = namespaceDropdown.value;
    defaultNamespace = selectedNamespace;
    showNotification(`Switched to namespace: ${selectedNamespace}`, "info");

    fetchKubernetesInfo(selectedNamespace);
    updatePodSelector(selectedNamespace);
  }

  function toggleAutoRefresh() {
    cleanup(); // Clean up existing interval
    
    if (autoRefreshToggle.checked) {
      autoRefreshInterval = setInterval(updateDashboard, 10000);
      showNotification("Auto-refresh enabled (10s)", "info");
    } else {
      showNotification("Auto-refresh disabled", "info");
    }
  }

  function manualRefresh() {
    if (refreshTimeout) {
      return; // Prevent rapid clicking
    }

    const refreshIcon = refreshButton.querySelector("i");
    refreshButton.classList.add("refreshing");
    refreshIcon.classList.add("fa-spin");

    updateDashboard();

    refreshTimeout = setTimeout(() => {
      refreshButton.classList.remove("refreshing");
      refreshIcon.classList.remove("fa-spin");
      refreshTimeout = null;
    }, 1000);
  }

  function exportScanResultsToFile() {
    const scanData = scanResults.textContent;
    if (!scanData || scanData === "{}") {
      showNotification("No scan results to export", "warning");
      return;
    }

    const blob = new Blob([scanData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trivy-scan-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification("Scan results exported", "success");
  }

  function filterLogs() {
    const filterText = logsFilter.value.toLowerCase();
    if (!currentPodLogs) return;

    if (!filterText) {
      logsOutput.textContent = currentPodLogs;
      return;
    }

    const lines = currentPodLogs.split("\n");
    const filteredLines = lines.filter((line) =>
      line.toLowerCase().includes(filterText),
    );

    logsOutput.textContent = filteredLines.join("\n");
  }

  function refreshPodLogs() {
    const selectedPod = podSelector.value;
    if (!selectedPod) {
      showNotification("No pod selected", "warning");
      return;
    }
    fetchPodLogs();
  }

  // ========== Dashboard Updates ==========
  async function updateDashboard() {
    try {
      // Show loading states
      setLoadingState(true);
      
      await Promise.all([
        fetchSystemInfo(),
        fetchNamespaces(),
        fetchPodStatuses(defaultNamespace)
      ]);
      
      // Hide loading states
      setLoadingState(false);
    } catch (error) {
      console.error("Dashboard update failed:", error);
      displayError(error, "Dashboard update failed");
      setLoadingState(false);
    }
  }

  // Loading state management
  function setLoadingState(isLoading) {
    const loadingElements = document.querySelectorAll('.loading-skeleton');
    const metricCards = document.querySelectorAll('.metric-card');
    const resourceCards = document.querySelectorAll('.resource-card');
    
    if (isLoading) {
      // Add loading class to elements
      metricCards.forEach(card => card.classList.add('loading'));
      resourceCards.forEach(card => card.classList.add('loading'));
      
      // Show skeleton loaders
      loadingElements.forEach(element => element.style.display = 'block');
    } else {
      // Remove loading class
      metricCards.forEach(card => card.classList.remove('loading'));
      resourceCards.forEach(card => card.classList.remove('loading'));
      
      // Hide skeleton loaders
      loadingElements.forEach(element => element.style.display = 'none');
    }
  }

  async function fetchSystemInfo() {
    try {
      // Check cache first
      const cachedData = getCachedData('systemInfo');
      if (cachedData) {
        updateSystemInfoUI(cachedData);
        return;
      }
      
      const data = await fetchWithRetry("http://127.0.0.1:5000/system_info");
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data received from server');
      }
      
      // Cache the data
      setCachedData('systemInfo', data);
      
      // Update UI
      updateSystemInfoUI(data);
    } catch (error) {
      displayError(error, "Failed to fetch system metrics");
      throw error; // Propagate for retry logic
    }
  }
  
  function updateSystemInfoUI(data) {
    // Update metric cards with validation
    const memoryElement = document.querySelector(".memory-utilization .percentage");
    const cpuElement = document.querySelector(".cpu-utilization .percentage");
    const storageElement = document.querySelector(".storage-used .percentage");
    
    if (memoryElement && data.memory_usage?.percent !== undefined) {
      memoryElement.textContent = `${Math.round(data.memory_usage.percent)}%`;
    }
    if (cpuElement && data.cpu_percent !== undefined) {
      cpuElement.textContent = `${Math.round(data.cpu_percent)}%`;
    }
    if (storageElement && data.disk_usage?.percent !== undefined) {
      storageElement.textContent = `${Math.round(data.disk_usage.percent)}%`;
    }

    // Update charts with validation
    if (window.charts.cpu && typeof data.cpu_percent === 'number') {
      updateChart(window.charts.cpu, data.cpu_percent);
    }
    if (window.charts.memory && typeof data.memory_usage?.percent === 'number') {
      updateChart(window.charts.memory, data.memory_usage.percent);
    }
    if (window.charts.storage && typeof data.disk_usage?.percent === 'number') {
      updateChart(window.charts.storage, data.disk_usage.percent);
    }
  }

  function updateChart(chart, newValue) {
    if (!chart) return;

    const now = new Date();
    const timeString =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0") +
      ":" +
      now.getSeconds().toString().padStart(2, "0");

    // Add new data point
    chart.data.labels.push(timeString);
    chart.data.datasets[0].data.push(newValue);

    // Remove oldest if we have more than 10 points
    if (chart.data.labels.length > 10) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }

    chart.update();
  }

  function fetchNamespaces() {
    fetch("http://127.0.0.1:5000/kubernetes_namespaces")
      .then((res) => res.json())
      .then((namespaces) => {
        namespaceDropdown.innerHTML = "";
        namespaces.forEach((ns) => {
          const option = document.createElement("option");
          option.value = ns;
          option.textContent = ns;
          namespaceDropdown.appendChild(option);
        });

        // Set default or retain selected
        if (!namespaces.includes(defaultNamespace)) {
          defaultNamespace = namespaces[0] || "default";
        }
        namespaceDropdown.value = defaultNamespace;

        fetchKubernetesInfo(defaultNamespace);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch namespaces:", err);
        showNotification("Failed to fetch namespaces", "error");
      });
  }

  function fetchKubernetesInfo(namespace) {
    fetch(`http://127.0.0.1:5000/kubernetes_info?namespace=${namespace}`)
      .then((res) => res.json())
      .then((data) => {
        document.querySelector(".deployments .count").textContent =
          data.num_deployments;
        document.querySelector(".pods-running .count").textContent =
          data.num_pods;
        document.querySelector(".services-running .count").textContent =
          data.num_services;
      })
      .catch((err) => {
        console.error(
          `❌ Failed to fetch Kubernetes info for ${namespace}:`,
          err,
        );
        showNotification(
          `Failed to fetch info for namespace: ${namespace}`,
          "error",
        );
      });
  }

  function fetchPodStatuses(namespace) {
    // This would typically call a backend endpoint that returns pod statuses
    // For this demo, we'll simulate the data
    const running = Math.floor(Math.random() * 10) + 5;
    const pending = Math.floor(Math.random() * 3);
    const failed = Math.floor(Math.random() * 2);

    // Update counters
    if (podsRunningCount) podsRunningCount.textContent = running;
    if (podsPendingCount) podsPendingCount.textContent = pending;
    if (podsFailedCount) podsFailedCount.textContent = failed;

    // Update chart
    if (window.podStatusChart) {
      window.podStatusChart.data.datasets[0].data = [running, pending, failed];
      window.podStatusChart.update();
    }

    // Update pod selector for logs
    updatePodSelector(namespace);
  }

  function updatePodSelector(namespace) {
    if (!podSelector) return;

    // In a real app, this would fetch actual pods from the API
    // For this demo, we'll create some sample pods
    const pods = [
      `${namespace}-web-app-7d9f8b7c9-a1b2c`,
      `${namespace}-database-6c8d7b6c5-d4e5f`,
      `${namespace}-cache-5b4c3b2a1-g6h7i`,
      `${namespace}-worker-4a3b2c1d0-j8k9l`,
    ];

    podSelector.innerHTML = '<option value="">-- Select Pod --</option>';

    pods.forEach((pod) => {
      const option = document.createElement("option");
      option.value = pod;
      option.textContent = pod;
      podSelector.appendChild(option);
    });
  }

  function fetchPodLogs() {
    const selectedPod = podSelector.value;

    if (!selectedPod) {
      logsOutput.textContent = "Select a pod to view logs";
      return;
    }

    logsOutput.textContent = "Fetching logs...";

    // In a real app, this would call a backend API to get actual pod logs
    // For this demo, we'll generate fake logs
    setTimeout(() => {
      const logLines = [];
      const logTypes = ["INFO", "DEBUG", "WARN", "ERROR"];
      const logMessages = [
        "Application started",
        "Processing request",
        "Database connection established",
        "Cache miss for key",
        "Request completed in",
        "Memory usage at",
        "Received message from queue",
        "Connection timeout",
        "Authentication successful",
        "Invalid request parameters",
      ];

      for (let i = 0; i < 50; i++) {
        const date = new Date();
        date.setSeconds(date.getSeconds() - i * 30);
        const timestamp = date.toISOString();

        const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
        const logMessage =
          logMessages[Math.floor(Math.random() * logMessages.length)];
        const details = Math.random().toString(36).substring(2, 10);

        logLines.push(`${timestamp} [${logType}] ${logMessage}: ${details}`);
      }

      currentPodLogs = logLines.join("\n");
      logsOutput.textContent = currentPodLogs;

      // Apply filter if one exists
      if (logsFilter.value) {
        filterLogs();
      }

      showNotification(`Logs fetched for pod: ${selectedPod}`, "success");
    }, 500);
  }

  function scanImage(imageName) {
    // Show progress indicator
    const scanButton = document.querySelector('.scan-button');
    const originalButtonText = scanButton.innerHTML;
    scanButton.disabled = true;
    scanButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
    
    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'scan-progress';
    progressBar.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-text">Scanning image...</div>
    `;
    scanResults.parentNode.insertBefore(progressBar, scanResults);
    
    fetch("http://127.0.0.1:5000/scan_image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ container_id: imageName }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Remove progress indicator
        if (progressBar.parentNode) {
          progressBar.parentNode.removeChild(progressBar);
        }
        
        // Restore button
        scanButton.disabled = false;
        scanButton.innerHTML = originalButtonText;
        
        if (data.error) {
          scanResults.textContent = `Error: ${data.error}`;
          showNotification(`Scan error: ${data.error}`, "error");
        } else {
          scanResults.textContent = "";
          renderScanResult(data.scan_results);
          updateVulnerabilitySummary(data.scan_results);
          showNotification(`Scan completed for: ${imageName}`, "success");
        }
      })
      .catch((err) => {
        // Remove progress indicator
        if (progressBar.parentNode) {
          progressBar.parentNode.removeChild(progressBar);
        }
        
        // Restore button
        scanButton.disabled = false;
        scanButton.innerHTML = originalButtonText;
        
        console.error("❌ Scan failed:", err);
        scanResults.textContent =
          "Scan failed. Please make sure Trivy is installed and the backend server is running.";
        showNotification("Image scan failed", "error");
      });
  }

  function renderScanResult(result) {
    try {
      const formatted =
        typeof result === "string" ? JSON.parse(result) : result;
      scanResults.textContent = JSON.stringify(formatted, null, 2);
    } catch (err) {
      scanResults.textContent = result;
    }
  }

  function updateVulnerabilitySummary(scanResult) {
    try {
      // In a real implementation, this would parse the actual Trivy output
      // For this demo, we'll create sample vulnerability counts
      const vulnerabilities = {
        critical: Math.floor(Math.random() * 3),
        high: Math.floor(Math.random() * 5) + 1,
        medium: Math.floor(Math.random() * 8) + 3,
        low: Math.floor(Math.random() * 10) + 5,
      };

      document.querySelector(".vuln-count.critical .count").textContent =
        vulnerabilities.critical;
      document.querySelector(".vuln-count.high .count").textContent =
        vulnerabilities.high;
      document.querySelector(".vuln-count.medium .count").textContent =
        vulnerabilities.medium;
      document.querySelector(".vuln-count.low .count").textContent =
        vulnerabilities.low;
    } catch (err) {
      console.error("Failed to update vulnerability summary:", err);
    }
  }

  // ========== Utility Functions ==========
  function showNotification(message, type = "info") {
    const container = document.getElementById("notifications");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = "notification";

    const iconType = {
      success: "check-circle",
      error: "times-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };

    notification.innerHTML = `
            <div class="notification-icon ${type}">
                <i class="fas fa-${iconType[type]}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
        `;

    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";

      setTimeout(() => {
        container.removeChild(notification);
      }, 300);
    }, 5000);
  }

  function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
});
