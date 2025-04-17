import os
import psutil
import logging
import subprocess
from flask import Flask, jsonify, request
from flask_cors import CORS
from kubernetes import client, config
from kubernetes.client.rest import ApiException

# Configuration from environment variables
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False") == "True"

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load Kubernetes configuration
try:
    config.load_kube_config()
    logging.info("✅ Kubernetes configuration loaded successfully.")
except Exception as e:
    logging.error(f"❌ Failed to load Kubernetes configuration: {str(e)}")

# Health Check
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

# System Information
@app.route('/system_info', methods=['GET'])
def get_system_info():
    try:
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        return jsonify({
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_usage': {
                'total': mem.total,
                'available': mem.available,
                'used': mem.used,
                'percent': mem.percent
            },
            'disk_usage': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent
            },
            'boot_time': psutil.boot_time()
        })
    except Exception as e:
        logging.error(f"❌ Error fetching system info: {str(e)}")
        return jsonify({'error': 'Failed to fetch system information'}), 500

# Kubernetes Cluster Summary
@app.route('/kubernetes_info', methods=['GET'])
def get_kubernetes_info():
    namespace = request.args.get('namespace', 'default')
    try:
        core_v1 = client.CoreV1Api()
        apps_v1 = client.AppsV1Api()

        deployments = apps_v1.list_namespaced_deployment(namespace)
        services = core_v1.list_namespaced_service(namespace)
        pods = core_v1.list_namespaced_pod(namespace)

        return jsonify({
            'namespace': namespace,
            'num_deployments': len(deployments.items),
            'num_services': len(services.items),
            'num_pods': len(pods.items)
        })
    except ApiException as e:
        logging.error(f"❌ Kubernetes API error: {e.reason}")
        return jsonify({'error': f"Kubernetes API error: {e.reason}"}), 500
    except Exception as e:
        logging.error(f"❌ Error fetching Kubernetes info: {str(e)}")
        return jsonify({'error': 'Failed to fetch Kubernetes information'}), 500

# Namespaces List
@app.route('/kubernetes_namespaces', methods=['GET'])
def get_kubernetes_namespaces():
    try:
        core_v1 = client.CoreV1Api()
        namespaces = [ns.metadata.name for ns in core_v1.list_namespace().items]
        return jsonify(namespaces)
    except Exception as e:
        logging.error(f"❌ Error fetching namespaces: {str(e)}")
        return jsonify({'error': 'Failed to fetch Kubernetes namespaces'}), 500

# Node Info
@app.route('/kubernetes_nodes', methods=['GET'])
def get_kubernetes_nodes():
    try:
        core_v1 = client.CoreV1Api()
        nodes = core_v1.list_node().items
        node_info = [
            {
                'name': node.metadata.name,
                'status': node.status.conditions[-1].type,
                'addresses': [addr.address for addr in node.status.addresses],
                'cpu': node.status.capacity.get('cpu'),
                'memory': node.status.capacity.get('memory')
            }
            for node in nodes
        ]
        return jsonify(node_info)
    except Exception as e:
        logging.error(f"❌ Error fetching node info: {str(e)}")
        return jsonify({'error': 'Failed to fetch node information'}), 500

# Pod Resource Usage
@app.route('/pod_metrics', methods=['GET'])
def get_pod_metrics():
    namespace = request.args.get('namespace', 'default')
    try:
        metrics_api = client.CustomObjectsApi()
        metrics = metrics_api.list_namespaced_custom_object(
            group="metrics.k8s.io",
            version="v1beta1",
            namespace=namespace,
            plural="pods"
        )
        return jsonify(metrics)
    except ApiException as e:
        logging.warning("📉 Metrics server might not be installed or accessible.")
        return jsonify({'error': 'Failed to fetch pod metrics', 'details': str(e)}), 500

# Trivy Image Scanner
@app.route('/scan_image', methods=['POST'])
def scan_image():
    data = request.get_json()
    image = data.get('container_id')

    if not image:
        return jsonify({'error': 'container_id is required'}), 400

    logging.info(f"🔍 Scanning container image: {image}")

    try:
        command = ['trivy', 'image', '--format', 'json', image]
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return jsonify({'scan_results': result.stdout})
    except subprocess.CalledProcessError as e:
        logging.error(f"❌ Trivy scan failed: {e.stderr}")
        return jsonify({'error': 'Trivy scan failed', 'details': e.stderr}), 500
    except Exception as e:
        logging.error(f"❌ Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

# Start the server
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=FLASK_DEBUG)
