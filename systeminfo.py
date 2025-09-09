import os
import json
import psutil
import logging
import time
import subprocess
import threading
from datetime import datetime
from flask import Flask, jsonify, request, Response, stream_with_context
from flask_cors import CORS
from kubernetes import client, config, watch
from kubernetes.client.rest import ApiException
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from typing import List, Any, TypedDict

def add_security_headers(response):
    """Add security headers to the response."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data:;"
    return response

# Configuration from environment variables
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False") == "True"
API_PORT = int(os.getenv("API_PORT", "5000"))
METRICS_INTERVAL = int(os.getenv("METRICS_INTERVAL", "5"))  # In seconds
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000").split(",")

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
    default_limits=["200 per day", "50 per hour"]
)

# Store historical metrics for charts
metrics_history = {
    "cpu": [],
    "memory": [],
    "disk": [],
    "timestamp": []
}

# Initialize Kubernetes configuration
try:
    config.load_kube_config()
    logger.info("✅ Kubernetes configuration loaded successfully.")
except Exception:
    try:
        # Try to load in-cluster config if running inside K8s
        config.load_incluster_config()
        logger.info("✅ In-cluster Kubernetes configuration loaded.")
    except Exception:
        logger.warning("⚠️ Failed to load Kubernetes configuration, some features will be limited.")

# Health Check
@app.route('/health', methods=['GET'])
def health_check():
    status = {"status": "ok", "timestamp": datetime.now().isoformat()}
    return jsonify(status), 200

# System Information
@app.route('/system_info', methods=['GET'])
@limiter.limit("30/minute")  # Add rate limiting
def get_system_info():
    try:
        # Validate request parameters
        try:
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
        except (OSError, PermissionError) as e:
            logger.error(f"❌ System access error: {str(e)}")
            return jsonify({'error': 'System access denied'}), 403

        # Get CPU info with per-core details
        try:
            cpu_percent = psutil.cpu_percent(interval=0.5)  # Reduced interval for better performance
            cpu_count = psutil.cpu_count()
            cpu_freq = psutil.cpu_freq()
            cpu_per_core = psutil.cpu_percent(interval=0.1, percpu=True)
        except Exception as e:
            logger.error(f"❌ CPU info error: {str(e)}")
            cpu_percent = 0
            cpu_count = 1
            cpu_freq = None
            cpu_per_core = [0]

        # Validate data ranges
        cpu_percent = max(0, min(100, cpu_percent)) if cpu_percent is not None else 0
        mem_percent = max(0, min(100, mem.percent)) if mem.percent is not None else 0
        disk_percent = max(0, min(100, disk.percent)) if disk.percent is not None else 0

        data = {
            'cpu_percent': round(cpu_percent, 2),
            'cpu_details': {
                'count': cpu_count,
                'frequency': {
                    'current': round(cpu_freq.current, 2) if cpu_freq and cpu_freq.current else None,
                    'min': round(cpu_freq.min, 2) if cpu_freq and hasattr(cpu_freq, 'min') and cpu_freq.min else None,
                    'max': round(cpu_freq.max, 2) if cpu_freq and hasattr(cpu_freq, 'max') and cpu_freq.max else None
                },
                'per_core': [round(core, 2) for core in cpu_per_core] if cpu_per_core else []
            },
            'memory_usage': {
                'total': mem.total,
                'available': mem.available,
                'used': mem.used,
                'percent': round(mem_percent, 2)
            },
            'disk_usage': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': round(disk_percent, 2)
            },
            'boot_time': psutil.boot_time(),
            'timestamp': datetime.now().isoformat()
        }

        # Add to history (limit to 100 points)
        metrics_history["cpu"].append(cpu_percent)
        metrics_history["memory"].append(mem_percent)
        metrics_history["disk"].append(disk_percent)
        metrics_history["timestamp"].append(datetime.now().isoformat())

        # Keep only the last 100 data points
        if len(metrics_history["cpu"]) > 100:
            metrics_history["cpu"] = metrics_history["cpu"][-100:]
            metrics_history["memory"] = metrics_history["memory"][-100:]
            metrics_history["disk"] = metrics_history["disk"][-100:]
            metrics_history["timestamp"] = metrics_history["timestamp"][-100:]

        return jsonify(data)
    except Exception as e:
        logger.error(f"❌ Error fetching system info: {str(e)}")
        return jsonify({'error': 'Failed to fetch system information', 'details': str(e)}), 500

# Historical metrics for charts
@app.route('/metrics_history', methods=['GET'])
def get_metrics_history():
    try:
        count = request.args.get('count', default=30, type=int)
        count = min(count, len(metrics_history["cpu"]))

        if count <= 0:
            return jsonify({"error": "Invalid count parameter"}), 400

        data = {
            "cpu": metrics_history["cpu"][-count:],
            "memory": metrics_history["memory"][-count:],
            "disk": metrics_history["disk"][-count:],
            "timestamp": metrics_history["timestamp"][-count:]
        }

        return jsonify(data)
    except Exception as e:
        logger.error(f"❌ Error fetching metrics history: {str(e)}")
        return jsonify({'error': 'Failed to fetch metrics history'}), 500

class PodStatus(TypedDict):
    running: int
    pending: int
    failed: int
    succeeded: int
    unknown: int

class KubernetesInfo(TypedDict):
    namespace: str
    num_deployments: int
    num_services: int
    num_pods: int
    num_configmaps: int
    num_secrets: int
    pod_statuses: PodStatus

def get_pod_statuses(pods: List[Any]) -> PodStatus:
    """Calculate pod status counts from a list of pods."""
    status_counts: PodStatus = {
        "running": 0,
        "pending": 0,
        "failed": 0,
        "succeeded": 0,
        "unknown": 0
    }

    for pod in pods:
        status = pod.status.phase
        if status:
            status_counts[status.lower()] += 1
        else:
            status_counts["unknown"] += 1

    return status_counts

def get_resource_counts(namespace: str) -> KubernetesInfo:
    """Get counts of various Kubernetes resources in a namespace."""
    try:
        core_v1 = client.CoreV1Api()
        apps_v1 = client.AppsV1Api()

        deployments = apps_v1.list_namespaced_deployment(namespace)
        services = core_v1.list_namespaced_service(namespace)
        pods = core_v1.list_namespaced_pod(namespace)
        configmaps = core_v1.list_namespaced_config_map(namespace)
        secrets = core_v1.list_namespaced_secret(namespace)

        pod_statuses = get_pod_statuses(pods.items)

        return {
            'namespace': namespace,
            'num_deployments': len(deployments.items),
            'num_services': len(services.items),
            'num_pods': len(pods.items),
            'num_configmaps': len(configmaps.items),
            'num_secrets': len(secrets.items),
            'pod_statuses': pod_statuses
        }
    except ApiException as e:
        logger.error(f"❌ Kubernetes API error: {e.reason}")
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching Kubernetes info: {str(e)}")
        raise

@app.route('/kubernetes_info', methods=['GET'])
@limiter.limit("60/minute")  # Add rate limiting
def get_kubernetes_info() -> Response:
    """API endpoint to get Kubernetes cluster information."""
    namespace = request.args.get('namespace', 'default')
    try:
        info = get_resource_counts(namespace)
        return jsonify(info)
    except ApiException as api_error:
        response = jsonify({'error': f"Kubernetes API error: {api_error.reason}"})
        response.status_code = 500
        return response
    except Exception:  # Remove unused 'e' variable since we're not using it
        response = jsonify({'error': 'Failed to fetch Kubernetes information'})
        response.status_code = 500
        return response

# Namespaces List
@app.route('/kubernetes_namespaces', methods=['GET'])
def get_kubernetes_namespaces():
    try:
        core_v1 = client.CoreV1Api()
        namespaces = [ns.metadata.name for ns in core_v1.list_namespace().items]
        return jsonify(namespaces)
    except Exception as e:
        logger.error(f"❌ Error fetching namespaces: {str(e)}")
        return jsonify({'error': 'Failed to fetch Kubernetes namespaces'}), 500

# Node Info
@app.route('/kubernetes_nodes', methods=['GET'])
def get_kubernetes_nodes():
    try:
        core_v1 = client.CoreV1Api()
        nodes = core_v1.list_node().items

        node_info = []
        for node in nodes:
            conditions = {cond.type: cond.status for cond in node.status.conditions}
            ready_status = "Ready" if conditions.get("Ready") == "True" else "NotReady"

            # Get usage metrics if metrics server is available
            cpu_usage = "N/A"
            memory_usage = "N/A"

            try:
                metrics_api = client.CustomObjectsApi()
                node_metrics = metrics_api.get_cluster_custom_object(
                    group="metrics.k8s.io",
                    version="v1beta1",
                    plural="nodes",
                    name=node.metadata.name
                )

                if node_metrics:
                    cpu_usage = node_metrics.get('usage', {}).get('cpu', 'N/A')
                    memory_usage = node_metrics.get('usage', {}).get('memory', 'N/A')
            except:
                # Metrics server might not be available
                pass

            node_data = {
                'name': node.metadata.name,
                'status': ready_status,
                'kubelet_version': node.status.node_info.kubelet_version,
                'os_image': node.status.node_info.os_image,
                'architecture': node.status.node_info.architecture,
                'container_runtime': node.status.node_info.container_runtime_version,
                'addresses': [addr.address for addr in node.status.addresses],
                'capacity': {
                    'cpu': node.status.capacity.get('cpu'),
                    'memory': node.status.capacity.get('memory'),
                    'pods': node.status.capacity.get('pods')
                },
                'usage': {
                    'cpu': cpu_usage,
                    'memory': memory_usage
                },
                'conditions': conditions,
                'labels': node.metadata.labels
            }
            node_info.append(node_data)

        return jsonify(node_info)
    except Exception as e:
        logger.error(f"❌ Error fetching node info: {str(e)}")
        return jsonify({'error': 'Failed to fetch node information'}), 500

# Pod List with Details
@app.route('/pods', methods=['GET'])
def get_pods():
    namespace = request.args.get('namespace', 'default')

    try:
        core_v1 = client.CoreV1Api()
        pods = core_v1.list_namespaced_pod(namespace)

        pod_list = []
        for pod in pods.items:
            containers = []
            for container in pod.spec.containers:
                container_data = {
                    'name': container.name,
                    'image': container.image,
                    'ready': False,
                    'started': False,
                    'state': 'unknown'
                }

                # Get container status if available
                if pod.status.container_statuses:
                    for status in pod.status.container_statuses:
                        if status.name == container.name:
                            container_data['ready'] = status.ready
                            container_data['started'] = status.started

                            # Determine container state
                            if status.state.running:
                                container_data['state'] = 'running'
                                container_data['started_at'] = status.state.running.started_at.isoformat() if status.state.running.started_at else None
                            elif status.state.waiting:
                                container_data['state'] = 'waiting'
                                container_data['reason'] = status.state.waiting.reason
                            elif status.state.terminated:
                                container_data['state'] = 'terminated'
                                container_data['reason'] = status.state.terminated.reason
                                container_data['exit_code'] = status.state.terminated.exit_code

                            container_data['restart_count'] = status.restart_count
                            break

                containers.append(container_data)

            pod_data = {
                'name': pod.metadata.name,
                'namespace': pod.metadata.namespace,
                'status': pod.status.phase,
                'pod_ip': pod.status.pod_ip,
                'host_ip': pod.status.host_ip,
                'node_name': pod.spec.node_name,
                'created_at': pod.metadata.creation_timestamp.isoformat() if pod.metadata.creation_timestamp else None,
                'containers': containers,
                'labels': pod.metadata.labels
            }
            pod_list.append(pod_data)

        return jsonify(pod_list)
    except ApiException as e:
        logger.error(f"❌ Kubernetes API error: {e.reason}")
        return jsonify({'error': f"Kubernetes API error: {e.reason}"}), 500
    except Exception as e:
        logger.error(f"❌ Error fetching pods: {str(e)}")
        return jsonify({'error': 'Failed to fetch pods'}), 500

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
        logger.warning("📉 Metrics server might not be installed or accessible.")
        return jsonify({'error': 'Failed to fetch pod metrics', 'details': str(e)}), 500
    except Exception as e:
        logger.error(f"❌ Error fetching pod metrics: {str(e)}")
        return jsonify({'error': 'Failed to fetch pod metrics', 'details': str(e)}), 500

# Pod Logs
@app.route('/pod_logs', methods=['GET'])
def get_pod_logs():
    namespace = request.args.get('namespace', 'default')
    pod_name = request.args.get('pod_name')
    container = request.args.get('container', None)
    tail_lines = request.args.get('tail_lines', 100, type=int)
    follow = request.args.get('follow', 'false').lower() == 'true'

    if not pod_name:
        return jsonify({'error': 'Pod name is required'}), 400

    try:
        core_v1 = client.CoreV1Api()

        if follow:
            def generate_logs():
                try:
                    logs = core_v1.read_namespaced_pod_log(
                        name=pod_name,
                        namespace=namespace,
                        container=container,
                        follow=True,
                        tail_lines=tail_lines,
                        _preload_content=False
                    )

                    for line in logs:
                        yield f"{line.decode('utf-8')}\n"

                except Exception as e:
                    yield f"Error streaming logs: {str(e)}\n"

            return Response(stream_with_context(generate_logs()), mimetype='text/plain')
        else:
            logs = core_v1.read_namespaced_pod_log(
                name=pod_name,
                namespace=namespace,
                container=container,
                tail_lines=tail_lines
            )
            return jsonify({'logs': logs.split('\n')})

    except ApiException as e:
        logger.error(f"❌ Kubernetes API error: {e.reason}")
        return jsonify({'error': f"Kubernetes API error: {e.reason}"}), 500
    except Exception as e:
        logger.error(f"❌ Error fetching pod logs: {str(e)}")
        return jsonify({'error': 'Failed to fetch pod logs'}), 500

# Trivy Image Scanner
@app.route('/scan_image', methods=['POST'])
def scan_image():
    data = request.get_json()
    image = data.get('container_id')

    if not image:
        return jsonify({'error': 'container_id is required'}), 400

    logger.info(f"🔍 Scanning container image: {image}")

    try:
        command = ['trivy', 'image', '--format', 'json', image]
        result = subprocess.run(command, capture_output=True, text=True, check=True)

        # Parse the JSON result to extract summary information
        try:
            scan_data = json.loads(result.stdout)

            # Extract vulnerability counts
            vulnerability_summary = {
                'critical': 0,
                'high': 0,
                'medium': 0,
                'low': 0,
                'unknown': 0
            }

            if 'Results' in scan_data:
                for r in scan_data['Results']:
                    if 'Vulnerabilities' in r:
                        for vuln in r['Vulnerabilities']:
                            severity = vuln.get('Severity', '').lower()
                            if severity in vulnerability_summary:
                                vulnerability_summary[severity] += 1

            return jsonify({
                'scan_results': result.stdout,
                'summary': vulnerability_summary
            })
        except json.JSONDecodeError:
            # If JSON parsing fails, return raw output
            return jsonify({'scan_results': result.stdout})

    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Trivy scan failed: {e.stderr}")
        return jsonify({'error': 'Trivy scan failed', 'details': e.stderr}), 500
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

# Kubernetes Component Status
@app.route('/k8s_component_status', methods=['GET'])
def get_component_status():
    try:
        core_v1 = client.CoreV1Api()
        components = core_v1.list_component_status()

        component_statuses = {}
        for component in components.items:
            status = "Healthy"
            conditions = []

            for condition in component.conditions:
                condition_status = {
                    'type': condition.type,
                    'status': condition.status,
                    'message': condition.message
                }
                conditions.append(condition_status)

                if condition.status != "True":
                    status = "Unhealthy"

            component_statuses[component.metadata.name] = {
                'status': status,
                'conditions': conditions
            }

        return jsonify(component_statuses)
    except Exception as e:
        logger.error(f"❌ Error fetching component status: {str(e)}")
        return jsonify({'error': 'Failed to fetch component status'}), 500

# Watch for pod events in a background thread
def watch_pod_events(namespace='default'):
    try:
        v1 = client.CoreV1Api()
        w = watch.Watch()

        for event in w.stream(v1.list_namespaced_pod, namespace=namespace):
            pod = event['object']
            event_type = event['type']

            # Store the event in a global events list
            # In a real application, you could use a message queue, database, or in-memory cache
            logger.info(f"Pod event: {event_type} {pod.metadata.namespace}/{pod.metadata.name}")

    except Exception as e:
        logger.error(f"❌ Error watching pod events: {str(e)}")
        # Retry after a delay
        time.sleep(5)
        watch_pod_events(namespace)

# Get recent pod events
@app.route('/pod_events', methods=['GET'])
def get_pod_events():
    namespace = request.args.get('namespace', 'default')

    try:
        v1 = client.CoreV1Api()
        events = v1.list_namespaced_event(namespace=namespace)

        # Filter and format events
        pod_events = []
        for event in events.items:
            if event.involved_object.kind.lower() == 'pod':
                pod_events.append({
                    'type': event.type,
                    'reason': event.reason,
                    'message': event.message,
                    'count': event.count,
                    'pod_name': event.involved_object.name,
                    'first_timestamp': event.first_timestamp.isoformat() if event.first_timestamp else None,
                    'last_timestamp': event.last_timestamp.isoformat() if event.last_timestamp else None
                })

        # Sort by most recent events first
        pod_events.sort(key=lambda x: x['last_timestamp'] or '', reverse=True)

        return jsonify(pod_events)
    except Exception as e:
        logger.error(f"❌ Error fetching pod events: {str(e)}")
        return jsonify({'error': 'Failed to fetch pod events'}), 500

# Start background thread for watching pod events
def start_event_watcher():
    event_thread = threading.Thread(target=watch_pod_events)
    event_thread.daemon = True
    event_thread.start()

# Start the server
if __name__ == '__main__':
    # Start event watcher thread
    # start_event_watcher()

    # Run the Flask app
    app.run(host='0.0.0.0', port=API_PORT, debug=FLASK_DEBUG)
