import psutil
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from config import METRICS_HISTORY_LIMIT

logger = logging.getLogger("k8s-dashboard")

# Store historical metrics for charts
metrics_history = {
    "cpu": [],
    "memory": [],
    "disk": [],
    "timestamp": []
}

# Thread lock for metrics history updates
_metrics_lock = threading.Lock()

# Cache for system info to avoid repeated calls
_system_info_cache = {}
_cache_timestamp = None
_cache_duration = timedelta(seconds=5)


def get_system_metrics() -> Dict[str, Any]:
    """Get current system metrics including CPU, memory, and disk usage."""
    global _system_info_cache, _cache_timestamp
    
    # Check cache to avoid repeated system calls
    now = datetime.now()
    if (_cache_timestamp and 
        now - _cache_timestamp < _cache_duration and 
        _system_info_cache):
        logger.debug("Using cached system metrics")
        return _system_info_cache.copy()
    
    try:
        logger.debug("Fetching fresh system metrics")
        
        # CPU metrics with better error handling
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)  # Reduced interval for faster response
            cpu_count = psutil.cpu_count(logical=True)  # Get logical CPUs
            cpu_physical = psutil.cpu_count(logical=False)  # Get physical CPUs
            cpu_freq = psutil.cpu_freq()
        except Exception as e:
            logger.warning(f"Error getting CPU metrics: {e}")
            cpu_percent = 0
            cpu_count = 1
            cpu_physical = 1
            cpu_freq = None
        
        # Per-core CPU usage with fallback
        try:
            cpu_per_core = psutil.cpu_percent(interval=0.1, percpu=True)
        except (AttributeError, OSError, Exception) as e:
            logger.warning(f"Error getting per-core CPU usage: {e}")
            cpu_per_core = [cpu_percent] * cpu_count if cpu_count else [0]
        
        # Memory metrics with validation
        try:
            mem = psutil.virtual_memory()
            if not hasattr(mem, 'percent') or mem.percent is None:
                raise ValueError("Invalid memory data")
        except Exception as e:
            logger.error(f"Error getting memory metrics: {e}")
            # Create fallback memory data
            mem = type('MemoryInfo', (), {
                'total': 0, 'available': 0, 'used': 0, 'percent': 0
            })()
        
        # Disk metrics with better mount point detection
        disk = None
        mount_points = ['/', '/home', '/usr', '/var', '/tmp', 'C:\\', 'D:\\']  # Include Windows paths
        
        for mount_point in mount_points:
            try:
                disk = psutil.disk_usage(mount_point)
                logger.debug(f"Successfully got disk usage for {mount_point}")
                break
            except (OSError, PermissionError, Exception) as e:
                logger.debug(f"Could not get disk usage for {mount_point}: {e}")
                continue
        
        if disk is None:
            logger.error("Could not get disk usage for any mount point")
            # Create fallback disk data
            disk = type('DiskInfo', (), {
                'total': 0, 'used': 0, 'free': 0, 'percent': 0
            })()

        # Validate and sanitize data ranges
        cpu_percent = max(0, min(100, float(cpu_percent))) if cpu_percent is not None else 0.0
        mem_percent = max(0, min(100, float(mem.percent))) if hasattr(mem, 'percent') and mem.percent is not None else 0.0
        disk_percent = max(0, min(100, float(disk.percent))) if hasattr(disk, 'percent') and disk.percent is not None else 0.0

        data = {
            'cpu_percent': round(cpu_percent, 2),
            'cpu_details': {
                'count': cpu_count,
                'physical_cores': cpu_physical,
                'frequency': {
                    'current': round(cpu_freq.current, 2) if cpu_freq and hasattr(cpu_freq, 'current') and cpu_freq.current else None,
                    'min': round(cpu_freq.min, 2) if cpu_freq and hasattr(cpu_freq, 'min') and cpu_freq.min else None,
                    'max': round(cpu_freq.max, 2) if cpu_freq and hasattr(cpu_freq, 'max') and cpu_freq.max else None
                },
                'per_core': [round(core, 2) for core in cpu_per_core] if cpu_per_core else []
            },
            'memory_usage': {
                'total': int(mem.total) if hasattr(mem, 'total') else 0,
                'available': int(mem.available) if hasattr(mem, 'available') else 0,
                'used': int(mem.used) if hasattr(mem, 'used') else 0,
                'percent': round(mem_percent, 2)
            },
            'disk_usage': {
                'total': int(disk.total) if hasattr(disk, 'total') else 0,
                'used': int(disk.used) if hasattr(disk, 'used') else 0,
                'free': int(disk.free) if hasattr(disk, 'free') else 0,
                'percent': round(disk_percent, 2)
            },
            'boot_time': psutil.boot_time(),
            'timestamp': now.isoformat(),
            'system_info': {
                'platform': psutil.platform.platform(),
                'cpu_arch': psutil.platform.architecture()[0],
                'machine': psutil.platform.machine()
            }
        }

        # Thread-safe update of metrics history
        with _metrics_lock:
            metrics_history["cpu"].append(cpu_percent)
            metrics_history["memory"].append(mem_percent)
            metrics_history["disk"].append(disk_percent)
            metrics_history["timestamp"].append(now.isoformat())

            # Keep only the last configured number of data points
            if len(metrics_history["cpu"]) > METRICS_HISTORY_LIMIT:
                metrics_history["cpu"] = metrics_history["cpu"][-METRICS_HISTORY_LIMIT:]
                metrics_history["memory"] = metrics_history["memory"][-METRICS_HISTORY_LIMIT:]
                metrics_history["disk"] = metrics_history["disk"][-METRICS_HISTORY_LIMIT:]
                metrics_history["timestamp"] = metrics_history["timestamp"][-METRICS_HISTORY_LIMIT:]

        # Update cache
        _system_info_cache = data.copy()
        _cache_timestamp = now
        
        logger.debug(f"Successfully collected system metrics: CPU={cpu_percent}%, MEM={mem_percent}%, DISK={disk_percent}%")
        return data

    except Exception as e:
        logger.error(f"❌ Critical error getting system metrics: {str(e)}", exc_info=True)
        # Return safe default values on error
        fallback_data = {
            'cpu_percent': 0.0,
            'cpu_details': {'count': 1, 'physical_cores': 1, 'frequency': {}, 'per_core': [0.0]},
            'memory_usage': {'total': 0, 'available': 0, 'used': 0, 'percent': 0.0},
            'disk_usage': {'total': 0, 'used': 0, 'free': 0, 'percent': 0.0},
            'boot_time': 0,
            'timestamp': now.isoformat(),
            'system_info': {'platform': 'Unknown', 'cpu_arch': 'Unknown', 'machine': 'Unknown'},
            'error': str(e)
        }
        return fallback_data


def get_metrics_history() -> Dict[str, List]:
    """Get historical metrics data in a thread-safe manner."""
    with _metrics_lock:
        return {
            "cpu": metrics_history["cpu"].copy(),
            "memory": metrics_history["memory"].copy(),
            "disk": metrics_history["disk"].copy(),
            "timestamp": metrics_history["timestamp"].copy()
        }


def clear_metrics_cache():
    """Clear the metrics cache and history."""
    global _system_info_cache, _cache_timestamp
    
    with _metrics_lock:
        metrics_history["cpu"].clear()
        metrics_history["memory"].clear()
        metrics_history["disk"].clear()
        metrics_history["timestamp"].clear()
    
    _system_info_cache = {}
    _cache_timestamp = None
    logger.info("Metrics cache and history cleared")


def get_system_info() -> Dict[str, Any]:
    """Get basic system information without performance metrics."""
    try:
        return {
            'platform': psutil.platform.platform(),
            'architecture': psutil.platform.architecture()[0],
            'machine': psutil.platform.machine(),
            'processor': psutil.platform.processor(),
            'cpu_count_logical': psutil.cpu_count(logical=True),
            'cpu_count_physical': psutil.cpu_count(logical=False),
            'boot_time': psutil.boot_time(),
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        return {
            'platform': 'Unknown',
            'architecture': 'Unknown',
            'machine': 'Unknown',
            'processor': 'Unknown',
            'cpu_count_logical': 1,
            'cpu_count_physical': 1,
            'boot_time': 0,
            'timestamp': datetime.now().isoformat(),
            'error': str(e)
        }
