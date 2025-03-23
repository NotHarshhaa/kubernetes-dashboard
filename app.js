document.addEventListener('DOMContentLoaded', () => {
  const scanForm = document.getElementById('scanForm');
  const healthCheckButton = document.getElementById('healthCheckButton');
  const healthCheckResult = document.getElementById('healthCheckResult');
  const namespaceDropdown = document.getElementById('namespace-dropdown');
  let defaultNamespace = '';

  // Handle Image Scanning
  if (scanForm) {
      scanForm.addEventListener('submit', (event) => {
          event.preventDefault();
          const imageInput = document.getElementById('imageInput').value.trim();
          if (imageInput) {
              scanImage(imageInput);
          } else {
              alert("Please enter a valid Docker image name.");
          }
      });
  }

  // Handle Health Check
  if (healthCheckButton) {
      healthCheckButton.addEventListener('click', () => {
          healthCheckResult.textContent = 'Checking...';

          fetch(`http://127.0.0.1:5000/kubernetes_info?namespace=${defaultNamespace}`)
              .then(response => response.json())
              .then(data => {
                  const numPods = data.num_pods;
                  healthCheckResult.textContent = numPods > 0 ? 'Healthy' : 'Unhealthy';
                  healthCheckResult.style.color = numPods > 0 ? 'green' : 'red';
              })
              .catch(error => {
                  healthCheckResult.textContent = 'Error checking health';
                  healthCheckResult.style.color = 'red';
                  console.error('Health check failed:', error);
              });
      });
  }

  // Fetch System Info and Update Dashboard
  function updateDashboard() {
      fetch('http://127.0.0.1:5000/system_info')
          .then(response => response.json())
          .then(data => {
              document.querySelector('.memory-utilization .percentage').textContent = `${data.memory_usage.percent}%`;
              document.querySelector('.cpu-utilization .percentage').textContent = `${data.cpu_percent}%`;
              document.querySelector('.storage-used .percentage').textContent = `${data.disk_usage.percent}%`;
          })
          .catch(error => console.error('Failed to fetch system info:', error));

      fetchNamespaces();
  }

  // Fetch Kubernetes Namespaces
  function fetchNamespaces() {
      fetch('http://127.0.0.1:5000/kubernetes_namespaces')
          .then(response => response.json())
          .then(namespaces => {
              namespaceDropdown.innerHTML = '';
              namespaces.forEach(namespace => {
                  const option = document.createElement('option');
                  option.value = namespace;
                  option.textContent = namespace;
                  namespaceDropdown.appendChild(option);
              });

              // Set default namespace and fetch Kubernetes info
              defaultNamespace = namespaces[0] || 'default';
              fetchKubernetesInfo(defaultNamespace);
          })
          .catch(error => console.error('Failed to fetch namespaces:', error));
  }

  // Fetch Kubernetes Info based on Namespace
  function fetchKubernetesInfo(namespace) {
      fetch(`http://127.0.0.1:5000/kubernetes_info?namespace=${namespace}`)
          .then(response => response.json())
          .then(data => {
              document.querySelector('.deployments .count').textContent = data.num_deployments;
              document.querySelector('.pods-running .count').textContent = data.num_pods;
              document.querySelector('.services-running .count').textContent = data.num_services;
          })
          .catch(error => console.error(`Failed to fetch Kubernetes info for namespace ${namespace}:`, error));
  }

  // Handle Image Scanning with Trivy
  function scanImage(imageName) {
      fetch('http://127.0.0.1:5000/scan_image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ container_id: imageName }),
      })
          .then(response => response.json())
          .then(data => {
              document.getElementById('scanResults').textContent = JSON.stringify(data.scan_results, null, 2);
          })
          .catch(error => console.error('Error scanning image:', error));
  }

  // Event Listener for Namespace Dropdown
  namespaceDropdown.addEventListener('change', () => {
      const selectedNamespace = namespaceDropdown.value;
      fetchKubernetesInfo(selectedNamespace);
  });

  updateDashboard();
});
