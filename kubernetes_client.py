import logging
import time
from typing import List, Dict, Any, Optional
from kubernetes import client, config, watch
from kubernetes.client.rest import ApiException
from dashboard_types import KubernetesInfo, PodStatus
from config import KUBE_CONFIG_PATH

logger = logging.getLogger("k8s-dashboard")

# Kubernetes client instances (cached)
_core_v1 = None
_apps_v1 = None
_k8s_available = False
_last_init_attempt = 0
_init_retry_interval = 30  # seconds


def init_kubernetes() -> bool:
    """Initialize Kubernetes configuration with retry logic."""
    global _core_v1, _apps_v1, _k8s_available, _last_init_attempt

    # Avoid repeated initialization attempts
    current_time = time.time()
    if _k8s_available and _core_v1 and _apps_v1:
        return True

    if current_time - _last_init_attempt < _init_retry_interval:
        logger.debug("Skipping Kubernetes initialization - too soon since last attempt")
        return _k8s_available

    _last_init_attempt = current_time

    try:
        # Try to load kube config from specified path or default
        if KUBE_CONFIG_PATH:
            config.load_kube_config(config_file=KUBE_CONFIG_PATH)
            logger.info(f"✅ Kubernetes configuration loaded from {KUBE_CONFIG_PATH}")
        else:
            config.load_kube_config()
            logger.info("✅ Kubernetes configuration loaded from default location")

        # Initialize API clients
        _core_v1 = client.CoreV1Api()
        _apps_v1 = client.AppsV1Api()

        # Test the connection by listing namespaces
        _core_v1.list_namespace()

        _k8s_available = True
        logger.info("✅ Kubernetes API connection verified successfully")
        return True

    except Exception as e:
        try:
            # Try to load in-cluster config if running inside K8s
            config.load_incluster_config()
            _core_v1 = client.CoreV1Api()
            _apps_v1 = client.AppsV1Api()

            # Test the connection
            _core_v1.list_namespace()

            _k8s_available = True
            logger.info("✅ In-cluster Kubernetes configuration loaded and verified")
            return True

        except Exception as e2:
            _k8s_available = False
            _core_v1 = None
            _apps_v1 = None
            logger.warning(f"⚠️ Failed to load Kubernetes configuration: {str(e2)}")
            logger.warning("⚠️ Kubernetes features will be limited")
            return False


def get_k8s_clients():
    """Get Kubernetes API clients, initializing if necessary."""
    if not _k8s_available or not _core_v1 or not _apps_v1:
        init_kubernetes()

    return _core_v1, _apps_v1


def get_resource_counts(namespace: str) -> KubernetesInfo:
    """Get counts of various Kubernetes resources in a namespace with enhanced error handling."""
    if not _k8s_available:
        raise RuntimeError("Kubernetes not available")

    core_v1, apps_v1 = get_k8s_clients()

    try:
        logger.debug(f"Fetching resource counts for namespace: {namespace}")

        # Get deployments with timeout
        deployments = apps_v1.list_namespaced_deployment(
            namespace=namespace, _request_timeout=10
        )
        num_deployments = len(deployments.items)

        # Get services with timeout
        services = core_v1.list_namespaced_service(
            namespace=namespace, _request_timeout=10
        )
        num_services = len(services.items)

        # Get pods with timeout and better error handling
        try:
            pods = core_v1.list_namespaced_pod(namespace=namespace, _request_timeout=10)
            num_pods = len(pods.items)
        except ApiException as e:
            if e.status == 403:
                logger.warning(f"Access denied to pods in namespace {namespace}")
                num_pods = 0
                pods = type("PodList", (), {"items": []})()
            else:
                raise

        # Count pod statuses with detailed categorization
        pod_statuses = get_pod_status_counts(pods.items)

        result = {
            "namespace": namespace,
            "num_deployments": num_deployments,
            "num_services": num_services,
            "num_pods": num_pods,
            "pod_statuses": pod_statuses,
            "timestamp": time.time(),
        }

        logger.debug(f"Resource counts for {namespace}: {result}")
        return result

    except ApiException as e:
        error_msg = f"Kubernetes API error: {e.reason} (status: {e.status})"
        if e.status == 404:
            error_msg = f"Namespace '{namespace}' not found"
        elif e.status == 403:
            error_msg = f"Access denied to namespace '{namespace}'"

        logger.error(f"❌ {error_msg}")
        raise RuntimeError(error_msg)
    except Exception as e:
        logger.error(
            f"❌ Error fetching Kubernetes info for namespace {namespace}: {str(e)}"
        )
        raise RuntimeError(f"Failed to fetch Kubernetes information: {str(e)}")


def get_pod_status_counts(pods: List) -> PodStatus:
    """Count pods by their status."""
    status_counts = {
        "running": 0,
        "pending": 0,
        "failed": 0,
        "succeeded": 0,
        "unknown": 0,
    }

    for pod in pods:
        phase = pod.status.phase.lower() if pod.status.phase else "unknown"
        if phase in status_counts:
            status_counts[phase] += 1
        else:
            status_counts["unknown"] += 1

    return status_counts


def get_namespaces() -> List[str]:
    """Get list of all namespaces."""
    try:
        core_v1 = client.CoreV1Api()
        namespaces = [ns.metadata.name for ns in core_v1.list_namespace().items]
        return namespaces
    except Exception as e:
        logger.error(f"❌ Error fetching namespaces: {str(e)}")
        return []


def get_nodes() -> List[Dict[str, Any]]:
    """Get information about cluster nodes."""
    try:
        core_v1 = client.CoreV1Api()
        nodes = core_v1.list_node().items

        node_info = []
        for node in nodes:
            node_data = {
                "name": node.metadata.name,
                "status": "Unknown" if not node.status.conditions else "Ready",
                "roles": [],
                "version": (
                    node.status.node_info.kubelet_version
                    if node.status.node_info
                    else "Unknown"
                ),
                "os_image": (
                    node.status.node_info.os_image
                    if node.status.node_info
                    else "Unknown"
                ),
                "kernel_version": (
                    node.status.node_info.kernel_version
                    if node.status.node_info
                    else "Unknown"
                ),
            }

            # Determine node roles from labels
            if node.metadata.labels:
                if "node-role.kubernetes.io/master" in node.metadata.labels:
                    node_data["roles"].append("master")
                if "node-role.kubernetes.io/control-plane" in node.metadata.labels:
                    node_data["roles"].append("control-plane")
                if "node-role.kubernetes.io/worker" in node.metadata.labels:
                    node_data["roles"].append("worker")
                if not node_data["roles"]:
                    node_data["roles"].append("worker")  # Default role

            node_info.append(node_data)

        return node_info
    except Exception as e:
        logger.error(f"❌ Error fetching nodes: {str(e)}")
        return []


def get_pods(namespace: str) -> List[Dict[str, Any]]:
    """Get list of pods in a namespace."""
    try:
        core_v1 = client.CoreV1Api()
        pods = core_v1.list_namespaced_pod(namespace=namespace)

        pod_list = []
        for pod in pods.items:
            pod_data = {
                "name": pod.metadata.name,
                "namespace": pod.metadata.namespace,
                "status": pod.status.phase if pod.status.phase else "Unknown",
                "node": pod.spec.node_name if pod.spec.node_name else "Unknown",
                "created": (
                    pod.metadata.creation_timestamp.isoformat()
                    if pod.metadata.creation_timestamp
                    else None
                ),
                "labels": pod.metadata.labels if pod.metadata.labels else {},
                "ip": pod.status.pod_ip if pod.status.pod_ip else None,
            }
            pod_list.append(pod_data)

        return pod_list
    except ApiException as e:
        logger.error(f"❌ Kubernetes API error: {e.reason}")
        return []
    except Exception as e:
        logger.error(f"❌ Error fetching pods: {str(e)}")
        return []


def get_pod_logs(
    namespace: str, pod_name: str, container: str = None, lines: int = 100
) -> str:
    """Get logs for a specific pod."""
    try:
        core_v1 = client.CoreV1Api()

        if container:
            logs = core_v1.read_namespaced_pod_log(
                name=pod_name,
                namespace=namespace,
                container=container,
                tail_lines=lines,
            )
        else:
            logs = core_v1.read_namespaced_pod_log(
                name=pod_name, namespace=namespace, tail_lines=lines
            )

        return logs
    except ApiException as e:
        logger.error(f"❌ Kubernetes API error: {e.reason}")
        return f"Error fetching logs: {e.reason}"
    except Exception as e:
        logger.error(f"❌ Error fetching pod logs: {str(e)}")
        return f"Error fetching logs: {str(e)}"


def get_component_status() -> Dict[str, str]:
    """Get status of Kubernetes components."""
    try:
        core_v1 = client.CoreV1Api()

        component_statuses = core_v1.list_component_status()

        status_map = {}
        for cs in component_statuses.items:
            if cs.metadata.name and cs.conditions:
                for condition in cs.conditions:
                    if condition.type == "Healthy":
                        status_map[cs.metadata.name] = condition.status
                        break

        # Default statuses if not found
        default_components = ["api-server", "scheduler", "controller-manager"]
        for component in default_components:
            if component not in status_map:
                status_map[component] = "Unknown"

        return status_map
    except Exception as e:
        logger.error(f"❌ Error fetching component status: {str(e)}")
        return {
            "api-server": "Unknown",
            "scheduler": "Unknown",
            "controller-manager": "Unknown",
        }
