import subprocess
import json
import logging
import threading
import time
from datetime import datetime
from typing import Dict, Any, Optional, List
from config import TRIVY_PATH, SCAN_TIMEOUT
from security import validate_image_name, sanitize_input
from dashboard_types import ScanResult, VulnerabilityCount

logger = logging.getLogger("k8s-dashboard")

# Cache for scan results to avoid repeated scans
_scan_cache = {}
_cache_lock = threading.Lock()
_cache_duration = 3600  # 1 hour cache for scan results

# Track running scans
_running_scans = set()
_scan_lock = threading.Lock()


def scan_image(image_name: str, force_refresh: bool = False) -> ScanResult:
    """Scan a Docker image for vulnerabilities using Trivy with caching and concurrent scan protection."""
    image_name = sanitize_input(image_name)

    if not validate_image_name(image_name):
        raise ValueError(f"Invalid image name format: {image_name}")

    # Check cache first unless force refresh is requested
    if not force_refresh:
        with _cache_lock:
            if image_name in _scan_cache:
                cached_result = _scan_cache[image_name]
                cache_age = time.time() - cached_result["timestamp"]
                if cache_age < _cache_duration:
                    logger.info(
                        f"📋 Using cached scan results for {image_name} (age: {cache_age:.0f}s)"
                    )
                    return cached_result["data"]

    # Check if scan is already running for this image
    with _scan_lock:
        if image_name in _running_scans:
            logger.info(f"⏳ Scan already running for {image_name}, waiting...")
            # Wait for the running scan to complete (simple polling)
            for _ in range(60):  # Wait up to 60 seconds
                time.sleep(1)
                if image_name not in _running_scans:
                    # Check cache again after waiting
                    with _cache_lock:
                        if image_name in _scan_cache:
                            return _scan_cache[image_name]["data"]
                    break
            else:
                raise TimeoutError(
                    f"Scan timeout for {image_name} - another scan is running too long"
                )

        # Mark this scan as running
        _running_scans.add(image_name)

    try:
        logger.info(f"🔍 Starting security scan for image: {image_name}")

        # Verify Trivy is available
        try:
            subprocess.run(
                [TRIVY_PATH, "--version"], capture_output=True, check=True, timeout=10
            )
        except (
            subprocess.CalledProcessError,
            FileNotFoundError,
            subprocess.TimeoutExpired,
        ) as e:
            logger.error(f"❌ Trivy not available or not working: {e}")
            raise RuntimeError(f"Security scanner not available: {str(e)}")

        # Run Trivy scan with enhanced options
        cmd = [
            TRIVY_PATH,
            "image",
            "--format",
            "json",
            "--quiet",
            "--no-progress",
            "--skip-update",  # Skip DB update for faster scans (consider security implications)
            image_name,
        ]

        logger.debug(f"Running command: {' '.join(cmd)}")

        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=SCAN_TIMEOUT
        )

        if result.returncode != 0:
            error_msg = result.stderr.strip() if result.stderr else "Unknown error"
            logger.error(f"❌ Trivy scan failed: {error_msg}")

            # Provide more helpful error messages
            if "no such image" in error_msg.lower():
                raise RuntimeError(
                    f"Image '{image_name}' not found. Please ensure the image exists locally or can be pulled."
                )
            elif "permission denied" in error_msg.lower():
                raise RuntimeError(
                    f"Permission denied accessing image '{image_name}'. Check Docker permissions."
                )
            else:
                raise RuntimeError(f"Security scan failed: {error_msg}")

        # Parse JSON results with better error handling
        try:
            scan_data = json.loads(result.stdout)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse Trivy JSON output: {str(e)}")
            logger.debug(f"Raw output: {result.stdout[:500]}...")
            raise RuntimeError("Failed to parse scan results - invalid JSON format")

        # Count vulnerabilities by severity with validation
        vuln_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        total_vulnerabilities = 0

        if scan_data and isinstance(scan_data, list) and len(scan_data) > 0:
            for result in scan_data:
                if "Vulnerabilities" in result and isinstance(
                    result["Vulnerabilities"], list
                ):
                    for vuln in result["Vulnerabilities"]:
                        severity = vuln.get("Severity", "").lower()
                        if severity in vuln_counts:
                            vuln_counts[severity] += 1
                            total_vulnerabilities += 1

        scan_result = {
            "image": image_name,
            "timestamp": datetime.now().isoformat(),
            "vulnerabilities": vuln_counts,
            "total_vulnerabilities": total_vulnerabilities,
            "details": scan_data,
            "scan_duration": time.time(),
            "cache_expires": time.time() + _cache_duration,
        }

        # Cache the results
        with _cache_lock:
            _scan_cache[image_name] = {"data": scan_result, "timestamp": time.time()}

        logger.info(
            f"✅ Scan completed for {image_name}: {vuln_counts} (Total: {total_vulnerabilities})"
        )
        return scan_result

    except subprocess.TimeoutExpired:
        logger.error(f"❌ Security scan timed out for {image_name}")
        raise RuntimeError(f"Security scan timed out after {SCAN_TIMEOUT} seconds")
    except Exception as e:
        logger.error(f"❌ Error during security scan for {image_name}: {str(e)}")
        raise
    finally:
        # Remove from running scans
        with _scan_lock:
            _running_scans.discard(image_name)


def get_scan_summary(image_name: str) -> Dict[str, Any]:
    """Get a summary of the latest scan for an image with cache awareness."""
    image_name = sanitize_input(image_name)

    try:
        # Check cache first
        with _cache_lock:
            if image_name in _scan_cache:
                cached_result = _scan_cache[image_name]["data"]
                cache_age = time.time() - _scan_cache[image_name]["timestamp"]

                return {
                    "image": cached_result["image"],
                    "timestamp": cached_result["timestamp"],
                    "vulnerabilities": cached_result["vulnerabilities"],
                    "total_vulnerabilities": cached_result.get(
                        "total_vulnerabilities", 0
                    ),
                    "has_critical": cached_result["vulnerabilities"]["critical"] > 0,
                    "has_high": cached_result["vulnerabilities"]["high"] > 0,
                    "cached": True,
                    "cache_age": cache_age,
                    "cache_expires": cached_result.get("cache_expires", 0),
                }

        # If not in cache, run a new scan
        scan_result = scan_image(image_name)

        return {
            "image": scan_result["image"],
            "timestamp": scan_result["timestamp"],
            "vulnerabilities": scan_result["vulnerabilities"],
            "total_vulnerabilities": scan_result.get("total_vulnerabilities", 0),
            "has_critical": scan_result["vulnerabilities"]["critical"] > 0,
            "has_high": scan_result["vulnerabilities"]["high"] > 0,
            "cached": False,
            "cache_age": 0,
            "cache_expires": scan_result.get("cache_expires", 0),
        }

    except Exception as e:
        logger.error(f"❌ Error getting scan summary for {image_name}: {str(e)}")
        return {
            "image": image_name,
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "vulnerabilities": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "total_vulnerabilities": 0,
            "has_critical": False,
            "has_high": False,
            "cached": False,
        }


def clear_scan_cache(image_name: Optional[str] = None):
    """Clear scan cache for a specific image or all images."""
    with _cache_lock:
        if image_name:
            if image_name in _scan_cache:
                del _scan_cache[image_name]
                logger.info(f"Cleared scan cache for {image_name}")
        else:
            _scan_cache.clear()
            logger.info("Cleared all scan cache")


def get_cached_scans() -> List[str]:
    """Get list of cached scan results."""
    with _cache_lock:
        return list(_scan_cache.keys())


def get_scan_cache_info() -> Dict[str, Any]:
    """Get information about the scan cache."""
    with _cache_lock:
        cache_info = {
            "total_cached_scans": len(_scan_cache),
            "cache_duration": _cache_duration,
            "cached_images": [],
        }

        for image_name, cache_data in _scan_cache.items():
            cache_age = time.time() - cache_data["timestamp"]
            cache_info["cached_images"].append(
                {
                    "image": image_name,
                    "timestamp": cache_data["timestamp"],
                    "age_seconds": cache_age,
                    "expires_in": _cache_duration - cache_age,
                }
            )

        return cache_info


def export_scan_results(scan_data: Dict[str, Any], format_type: str = "json") -> str:
    """Export scan results in specified format."""
    try:
        if format_type.lower() == "json":
            return json.dumps(scan_data, indent=2)
        elif format_type.lower() == "csv":
            # Simple CSV export for vulnerabilities
            if "details" in scan_data and isinstance(scan_data["details"], list):
                csv_lines = [
                    "Severity,Vulnerability,Package,Installed Version,Fixed Version"
                ]

                for result in scan_data["details"]:
                    if "Vulnerabilities" in result:
                        for vuln in result["Vulnerabilities"]:
                            csv_lines.append(
                                f"{vuln.get('Severity', '')},"
                                f"{vuln.get('VulnerabilityID', '')},"
                                f"{vuln.get('PkgName', '')},"
                                f"{vuln.get('InstalledVersion', '')},"
                                f"{vuln.get('FixedVersion', '')}"
                            )

                return "\n".join(csv_lines)
            else:
                return "No vulnerability data available for CSV export"
        else:
            raise ValueError(f"Unsupported export format: {format_type}")

    except Exception as e:
        logger.error(f"❌ Error exporting scan results: {str(e)}")
        return f"Error exporting results: {str(e)}"
