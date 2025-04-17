document.addEventListener('DOMContentLoaded', () => {
    const scanForm = document.getElementById('scanForm');
    const imageInput = document.getElementById('imageInput');
    const scanResults = document.getElementById('scanResults');
    const healthCheckButton = document.getElementById('healthCheckButton');
    const healthCheckResult = document.getElementById('healthCheckResult');
    const namespaceDropdown = document.getElementById('namespace-dropdown');
    const autoRefreshToggle = document.getElementById('autoRefreshToggle');
    let defaultNamespace = 'default';
    let autoRefreshInterval;
  
    // ========== Initial Setup ==========
    init();
  
    function init() {
      if (scanForm) scanForm.addEventListener('submit', handleImageScan);
      if (healthCheckButton) healthCheckButton.addEventListener('click', handleHealthCheck);
      if (namespaceDropdown) namespaceDropdown.addEventListener('change', handleNamespaceChange);
      if (autoRefreshToggle) autoRefreshToggle.addEventListener('change', toggleAutoRefresh);
  
      updateDashboard();
    }
  
    // ========== Handlers ==========
  
    function handleImageScan(event) {
      event.preventDefault();
      const imageName = imageInput.value.trim();
      if (!imageName) return alert("Please enter a Docker image name.");
      scanResults.textContent = "Scanning...";
      scanImage(imageName);
    }
  
    function handleHealthCheck() {
      healthCheckResult.textContent = 'Checking...';
      fetchKubernetesInfo(defaultNamespace, (data) => {
        const healthy = data.num_pods > 0;
        healthCheckResult.textContent = healthy ? 'Healthy' : 'Unhealthy';
        healthCheckResult.style.color = healthy ? 'green' : 'red';
      }, () => {
        healthCheckResult.textContent = 'Error';
        healthCheckResult.style.color = 'red';
      });
    }
  
    function handleNamespaceChange() {
      const selectedNamespace = namespaceDropdown.value;
      defaultNamespace = selectedNamespace;
      fetchKubernetesInfo(selectedNamespace);
    }
  
    function toggleAutoRefresh() {
      if (autoRefreshToggle.checked) {
        autoRefreshInterval = setInterval(updateDashboard, 5000);
      } else {
        clearInterval(autoRefreshInterval);
      }
    }
  
    // ========== Dashboard ==========
  
    function updateDashboard() {
      fetchSystemInfo();
      fetchNamespaces();
    }
  
    function fetchSystemInfo() {
      fetch('http://127.0.0.1:5000/system_info')
        .then(res => res.json())
        .then(data => {
          document.querySelector('.memory-utilization .percentage').textContent = `${data.memory_usage.percent}%`;
          document.querySelector('.cpu-utilization .percentage').textContent = `${data.cpu_percent}%`;
          document.querySelector('.storage-used .percentage').textContent = `${data.disk_usage.percent}%`;
        })
        .catch(err => console.error('❌ System info fetch failed:', err));
    }
  
    function fetchNamespaces() {
      fetch('http://127.0.0.1:5000/kubernetes_namespaces')
        .then(res => res.json())
        .then(namespaces => {
          namespaceDropdown.innerHTML = '';
          namespaces.forEach(ns => {
            const option = document.createElement('option');
            option.value = ns;
            option.textContent = ns;
            namespaceDropdown.appendChild(option);
          });
  
          // Set default or retain selected
          if (!namespaces.includes(defaultNamespace)) {
            defaultNamespace = namespaces[0] || 'default';
          }
          namespaceDropdown.value = defaultNamespace;
  
          fetchKubernetesInfo(defaultNamespace);
        })
        .catch(err => console.error('❌ Failed to fetch namespaces:', err));
    }
  
    function fetchKubernetesInfo(namespace, onSuccess, onError) {
      fetch(`http://127.0.0.1:5000/kubernetes_info?namespace=${namespace}`)
        .then(res => res.json())
        .then(data => {
          document.querySelector('.deployments .count').textContent = data.num_deployments;
          document.querySelector('.pods-running .count').textContent = data.num_pods;
          document.querySelector('.services-running .count').textContent = data.num_services;
          if (onSuccess) onSuccess(data);
        })
        .catch(err => {
          console.error(`❌ Failed to fetch Kubernetes info for ${namespace}:`, err);
          if (onError) onError(err);
        });
    }
  
    function scanImage(imageName) {
      fetch('http://127.0.0.1:5000/scan_image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container_id: imageName }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            scanResults.textContent = `Error: ${data.error}`;
            scanResults.style.color = 'red';
          } else {
            scanResults.style.color = 'black';
            scanResults.textContent = '';
            renderScanResult(data.scan_results);
          }
        })
        .catch(err => {
          console.error('❌ Scan failed:', err);
          scanResults.textContent = 'Scan failed.';
          scanResults.style.color = 'red';
        });
    }
  
    function renderScanResult(result) {
      try {
        const formatted = typeof result === 'string' ? JSON.parse(result) : result;
        scanResults.textContent = JSON.stringify(formatted, null, 2);
      } catch (err) {
        scanResults.textContent = result;
      }
    }
  });
  