import logging
from kubernetes import client, config, watch
from kubernetes.client.rest import ApiException
from typing import List, Dict, Any
from types import KubernetesInfo, PodStatus

logger = logging.getLogger("k8s-dashboard")

# Initialize Kubernetes configuration
def init_kubernetes():
    """Initialize Kubernetes configuration."""
    try:
        config.load_kube_config()
        logger.info("✅ Kubernetes configuration loaded successfully.")
        return True
    except Exception:
        try:
            # Try to load in-cluster config if running inside K8s
            config.load_incluster_config()
            logger.info("✅ In-cluster Kubernetes configuration loaded.")
            return True
        except Exception:
            logger.warning("⚠️ Failed to load Kubernetes configuration, some features will be limited.")
            return False


def get_resource_counts(namespace: str) -> KubernetesInfo:
    """Get counts of various Kubernetes resources in a namespace."""
    try:
        core_v1 = client.CoreV1Api()
        apps_v1 = client.AppsV1Api()
        
        # Get deployments
        deployments = apps_v1.list_namespaced_deployment(namespace=namespace)
        num_deployments = len(deployments.items)
        
        # Get services
        services = core_v1.list_namespaced_service(namespace=namespace)
        num_services = len(services.items)
        
        # Get pods and their statuses
        pods = core_v1.list_namespaced_pod(namespace=namespace)
        num_pods = len(pods.items)
        
        # Count pod statuses
        pod_statuses = get_pod_status_counts(pods.items)
        
        return {
            'namespace': namespace,
            'num_deployments': num_deployments,
            'num_services': num_services,
            'num_pods': num_pods,
            'pod_statuses': pod_statuses
        }
    except ApiException as e:
        logger.error(f"❌ Kubernetes API error: {e.reason}")
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching Kubernetes info: {str(e)}")
        raise


def get_pod_status_counts(pods: List) -> PodStatus:
    """Count pods by their status."""
    status_counts = {
        "running": 0,
        "pending": 0,
        "failed": 0,
        "succeeded": 0,
        "unknown": 0
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
                'name': node.metadata.name,
                'status': 'Unknown' if not node.status.conditions else 'Ready',
                'roles': [],
                'version': node.status.node_info.kubelet_version if node.status.node_info else 'Unknown',
                'os_image': node.status.node_info.os_image if node.status.node_info else 'Unknown',
                'kernel_version': node.status.node_info.kernel_version if node.status.node_info else 'Unknown'
            }
            
            # Determine node roles from labels
            if node.metadata.labels:
                if 'node-role.kubernetes.io/master' in node.metadata.labels:
                    node_data['roles'].append('master')
                if 'node-role.kubernetes.io/control-plane' in node.metadata.labels:
                    node_data['roles'].append('control-plane')
                if 'node-role.kubernetes.io/worker' in node.metadata.labels:
                    node_data['roles'].append('worker')
                if not node_data['roles']:
                    node_data['roles'].append('worker')  # Default role
            
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
                'name': pod.metadata.name,
                'namespace': pod.metadata.namespace,
                'status': pod.status.phase if pod.status.phase else 'Unknown',
                'node': pod.spec.node_name if pod.spec.node_name else 'Unknown',
                'created': pod.metadata.creation_timestamp.isoformat() if pod.metadata.creation_timestamp else None,
                'labels': pod.metadata.labels if pod.metadata.labels else {},
                'ip': pod.status.pod_ip if pod.status.pod_ip else None
            }
            pod_list.append(pod_data)
        
        return pod_list
    except ApiException as e:
        logger.error(f"❌ Kubernetes API error: {e.reason}")
        return []
    except Exception as e:
        logger.error(f"❌ Error fetching pods: {str(e)}")
        return []


def get_pod_logs(namespace: str, pod_name: str, container: str = None, lines: int = 100) -> str:
    """Get logs for a specific pod."""
    try:
        core_v1 = client.CoreV1Api()
        
        if container:
            logs = core_v1.read_namespaced_pod_log(
                name=pod_name,
                namespace=namespace,
                container=container,
                tail_lines=lines
            )
        else:
            logs = core_v1.read_namespaced_pod_log(
                name=pod_name,
                namespace=namespace,
                tail_lines=lines
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
        default_components = ['api-server', 'scheduler', 'controller-manager']
        for component in default_components:
            if component not in status_map:
                status_map[component] = 'Unknown'
        
        return status_map
    except Exception as e:
        logger.error(f"❌ Error fetching component status: {str(e)}")
        return {
            'api-server': 'Unknown',
            'scheduler': 'Unknown', 
            'controller-manager': 'Unknown'
        }
