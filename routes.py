import logging
from datetime import datetime
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Import modular components
from config import (
    LOG_LEVEL, FLASK_DEBUG, API_PORT, ALLOWED_ORIGINS, 
    RATE_LIMITS, METRICS_INTERVAL
)
from security import add_security_headers, sanitize_input, validate_image_name
from system_monitor import get_system_metrics, get_metrics_history
from kubernetes_client import (
    init_kubernetes, get_resource_counts, get_namespaces, 
    get_nodes, get_pods, get_pod_logs, get_component_status
)
from security_scanner import scan_image, get_scan_summary, export_scan_results

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("k8s-dashboard")

# Initialize Flask app
app = Flask(__name__)
app.after_request(add_security_headers)
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=RATE_LIMITS
)

# Initialize Kubernetes
k8s_available = init_kubernetes()


# Health Check
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'kubernetes_connected': k8s_available
    })


# System Metrics
@app.route('/system_info', methods=['GET'])
@limiter.limit("30 per minute")
def get_system_info():
    """Get current system metrics."""
    try:
        metrics = get_system_metrics()
        return jsonify(metrics)
    except Exception as e:
        logger.error(f"❌ Error in system_info endpoint: {str(e)}")
        return jsonify({'error': 'Failed to get system information'}), 500


# Metrics History
@app.route('/metrics_history', methods=['GET'])
def get_history():
    """Get historical metrics data."""
    try:
        history = get_metrics_history()
        return jsonify(history)
    except Exception as e:
        logger.error(f"❌ Error getting metrics history: {str(e)}")
        return jsonify({'error': 'Failed to get metrics history'}), 500


# Kubernetes Information
@app.route('/kubernetes_info', methods=['GET'])
@limiter.limit("60 per minute")
def get_kubernetes_info():
    """API endpoint to get Kubernetes cluster information."""
    if not k8s_available:
        return jsonify({'error': 'Kubernetes not available'}), 503
    
    namespace = request.args.get('namespace', 'default')
    namespace = sanitize_input(namespace)
    
    try:
        info = get_resource_counts(namespace)
        return jsonify(info)
    except Exception as e:
        logger.error(f"❌ Error in kubernetes_info endpoint: {str(e)}")
        return jsonify({'error': 'Failed to fetch Kubernetes information'}), 500


# Namespaces
@app.route('/kubernetes_namespaces', methods=['GET'])
def get_kubernetes_namespaces():
    """Get list of Kubernetes namespaces."""
    if not k8s_available:
        return jsonify({'error': 'Kubernetes not available'}), 503
    
    try:
        namespaces = get_namespaces()
        return jsonify(namespaces)
    except Exception as e:
        logger.error(f"❌ Error fetching namespaces: {str(e)}")
        return jsonify({'error': 'Failed to fetch Kubernetes namespaces'}), 500


# Nodes
@app.route('/kubernetes_nodes', methods=['GET'])
def get_kubernetes_nodes():
    """Get Kubernetes cluster nodes information."""
    if not k8s_available:
        return jsonify({'error': 'Kubernetes not available'}), 503
    
    try:
        nodes = get_nodes()
        return jsonify(nodes)
    except Exception as e:
        logger.error(f"❌ Error fetching nodes: {str(e)}")
        return jsonify({'error': 'Failed to fetch node information'}), 500


# Pods
@app.route('/kubernetes_pods', methods=['GET'])
def get_kubernetes_pods():
    """Get pods in a namespace."""
    if not k8s_available:
        return jsonify({'error': 'Kubernetes not available'}), 503
    
    namespace = request.args.get('namespace', 'default')
    namespace = sanitize_input(namespace)
    
    try:
        pods = get_pods(namespace)
        return jsonify(pods)
    except Exception as e:
        logger.error(f"❌ Error fetching pods: {str(e)}")
        return jsonify({'error': 'Failed to fetch pods'}), 500


# Pod Logs
@app.route('/pod_logs', methods=['GET'])
@limiter.limit("20 per minute")
def get_pod_logs_endpoint():
    """Get logs for a specific pod."""
    if not k8s_available:
        return jsonify({'error': 'Kubernetes not available'}), 503
    
    namespace = request.args.get('namespace', 'default')
    pod_name = request.args.get('pod')
    container = request.args.get('container')
    lines = int(request.args.get('lines', 100))
    
    # Sanitize inputs
    namespace = sanitize_input(namespace)
    pod_name = sanitize_input(pod_name)
    container = sanitize_input(container) if container else None
    
    if not pod_name:
        return jsonify({'error': 'Pod name is required'}), 400
    
    try:
        logs = get_pod_logs(namespace, pod_name, container, lines)
        return jsonify({'logs': logs.split('\n')})
    except Exception as e:
        logger.error(f"❌ Error fetching pod logs: {str(e)}")
        return jsonify({'error': 'Failed to fetch pod logs'}), 500


# Component Status
@app.route('/k8s_component_status', methods=['GET'])
def get_component_status_endpoint():
    """Get Kubernetes component status."""
    if not k8s_available:
        return jsonify({'error': 'Kubernetes not available'}), 503
    
    try:
        status = get_component_status()
        return jsonify(status)
    except Exception as e:
        logger.error(f"❌ Error fetching component status: {str(e)}")
        return jsonify({'error': 'Failed to fetch component status'}), 500


# Security Scan
@app.route('/scan_image', methods=['POST'])
@limiter.limit("10 per minute")
def scan_image_endpoint():
    """Scan a Docker image for vulnerabilities."""
    image_name = request.json.get('image') if request.is_json else request.form.get('image')
    
    if not image_name:
        return jsonify({'error': 'Image name is required'}), 400
    
    image_name = sanitize_input(image_name)
    
    if not validate_image_name(image_name):
        return jsonify({'error': 'Invalid image name format'}), 400
    
    try:
        result = scan_image(image_name)
        return jsonify(result)
    except Exception as e:
        logger.error(f"❌ Error during security scan: {str(e)}")
        return jsonify({'error': str(e)}), 500


# Export Scan Results
@app.route('/export_scan', methods=['POST'])
def export_scan_endpoint():
    """Export scan results."""
    scan_data = request.json.get('scan_data')
    format_type = request.json.get('format', 'json')
    
    if not scan_data:
        return jsonify({'error': 'Scan data is required'}), 400
    
    try:
        exported_data = export_scan_results(scan_data, format_type)
        return Response(
            exported_data,
            mimetype='application/json' if format_type == 'json' else 'text/csv',
            headers={'Content-Disposition': f'attachment; filename=scan_results.{format_type}'}
        )
    except Exception as e:
        logger.error(f"❌ Error exporting scan results: {str(e)}")
        return jsonify({'error': 'Failed to export results'}), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


@app.errorhandler(429)
def rate_limit_exceeded(e):
    return jsonify({'error': 'Rate limit exceeded'}), 429


if __name__ == '__main__':
    logger.info(f"🚀 Starting Kubernetes Dashboard API on port {API_PORT}")
    logger.info(f"📊 Kubernetes available: {k8s_available}")
    app.run(host='0.0.0.0', port=API_PORT, debug=FLASK_DEBUG)
