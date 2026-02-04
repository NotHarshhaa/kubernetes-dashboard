import psutil
import logging
from datetime import datetime
from typing import Dict, Any
from config import METRICS_HISTORY_LIMIT

logger = logging.getLogger("k8s-dashboard")

# Store historical metrics for charts
metrics_history = {
    "cpu": [],
    "memory": [],
    "disk": [],
    "timestamp": []
}


def get_system_metrics() -> Dict[str, Any]:
    """Get current system metrics including CPU, memory, and disk usage."""
    try:
        # CPU metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        cpu_freq = psutil.cpu_freq()
        
        # Per-core CPU usage
        try:
            cpu_per_core = psutil.cpu_percent(interval=1, percpu=True)
        except (AttributeError, OSError):
            cpu_per_core = [cpu_percent]
        
        # Memory metrics
        mem = psutil.virtual_memory()
        
        # Disk metrics
        try:
            disk = psutil.disk_usage('/')
        except OSError:
            # Try common mount points if root fails
            mount_points = ['/home', '/usr', '/var']
            disk = None
            for mount_point in mount_points:
                try:
                    disk = psutil.disk_usage(mount_point)
                    break
                except OSError:
                    continue
            
            if disk is None:
                raise OSError("Could not get disk usage for any mount point")
        
        # Handle edge cases for virtual environments
        if cpu_count is None:
            cpu_count = 1
        if cpu_freq is None:
            cpu_freq = None
        if cpu_per_core is None:
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

        # Add to history (limit to configured number of points)
        metrics_history["cpu"].append(cpu_percent)
        metrics_history["memory"].append(mem_percent)
        metrics_history["disk"].append(disk_percent)
        metrics_history["timestamp"].append(datetime.now().isoformat())

        # Keep only the last configured number of data points
        if len(metrics_history["cpu"]) > METRICS_HISTORY_LIMIT:
            metrics_history["cpu"] = metrics_history["cpu"][-METRICS_HISTORY_LIMIT:]
            metrics_history["memory"] = metrics_history["memory"][-METRICS_HISTORY_LIMIT:]
            metrics_history["disk"] = metrics_history["disk"][-METRICS_HISTORY_LIMIT:]
            metrics_history["timestamp"] = metrics_history["timestamp"][-METRICS_HISTORY_LIMIT:]

        return data

    except Exception as e:
        logger.error(f"❌ Error getting system metrics: {str(e)}")
        # Return default values on error
        return {
            'cpu_percent': 0,
            'cpu_details': {'count': 0, 'frequency': {}, 'per_core': []},
            'memory_usage': {'total': 0, 'available': 0, 'used': 0, 'percent': 0},
            'disk_usage': {'total': 0, 'used': 0, 'free': 0, 'percent': 0},
            'boot_time': 0,
            'timestamp': datetime.now().isoformat()
        }


def get_metrics_history() -> Dict[str, List]:
    """Get historical metrics data."""
    return metrics_history.copy()
