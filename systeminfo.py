import psutil
import logging
import subprocess
from flask import Flask, jsonify, request
from flask_cors import CORS
from kubernetes import client, config

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Load Kubernetes configuration
try:
    config.load_kube_config()
    logging.info("Kubernetes configuration loaded successfully.")
except Exception as e:
    logging.error(f"Failed to load Kubernetes configuration: {str(e)}")

# System Information Route
@app.route('/system_info', methods=['GET'])
def get_system_info():
    """Retrieve system information including CPU, memory, and disk usage."""
    try:
        system_info = {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_usage': {
                'total': psutil.virtual_memory().total,
                'available': psutil.virtual_memory().available,
                'used': psutil.virtual_memory().used,
                'percent': psutil.virtual_memory().percent
            },
            'disk_usage': {
                'total': psutil.disk_usage('/').total,
                'used': psutil.disk_usage('/').used,
                'free': psutil.disk_usage('/').free,
                'percent': psutil.disk_usage('/').percent
            }
        }
        return jsonify(system_info)
    except Exception as e:
        logging.error(f"Error fetching system info: {str(e)}")
        return jsonify({'error': 'Failed to fetch system information'}), 500

# Kubernetes Cluster Information Route
@app.route('/kubernetes_info', methods=['GET'])
def get_kubernetes_info():
    """Fetch information about Kubernetes deployments, services, and pods in a namespace."""
    namespace = request.args.get('namespace', 'default')

    try:
        k8s_api = client.CoreV1Api()
        deployments_api = client.AppsV1Api()

        num_deployments = len(deployments_api.list_namespaced_deployment(namespace).items)
        num_services = len(k8s_api.list_namespaced_service(namespace).items)
        num_pods = len(k8s_api.list_namespaced_pod(namespace).items)

        return jsonify({
            'num_deployments': num_deployments,
            'num_services': num_services,
            'num_pods': num_pods
        })
    except Exception as e:
        logging.error(f"Error fetching Kubernetes info: {str(e)}")
        return jsonify({'error': 'Failed to fetch Kubernetes information'}), 500

# Kubernetes Namespaces Route
@app.route('/kubernetes_namespaces', methods=['GET'])
def get_kubernetes_namespaces():
    """Retrieve a list of all available Kubernetes namespaces."""
    try:
        k8s_api = client.CoreV1Api()
        namespaces = [ns.metadata.name for ns in k8s_api.list_namespace().items]
        return jsonify(namespaces)
    except Exception as e:
        logging.error(f"Error fetching namespaces: {str(e)}")
        return jsonify({'error': 'Failed to fetch Kubernetes namespaces'}), 500

# Trivy Image Scanning Route
@app.route('/scan_image', methods=['POST'])
def scan_image():
    """Perform a security scan on a container image using Trivy."""
    data = request.get_json()
    if not data or 'container_id' not in data:
        return jsonify({'error': 'Container ID is required'}), 400

    container_id = data['container_id']
    logging.info(f"Initiating Trivy scan for container ID: {container_id}")

    try:
        command = ['trivy', 'image', '--format', 'json', container_id]
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        scan_output = result.stdout

        logging.info(f"Trivy scan completed for {container_id}")

        return jsonify({'scan_results': scan_output})
    except subprocess.CalledProcessError as e:
        logging.error(f"Trivy scan failed: {str(e)}")
        return jsonify({'error': 'Trivy scan failed'}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)

# End of script
