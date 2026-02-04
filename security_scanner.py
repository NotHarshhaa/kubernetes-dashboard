import subprocess
import json
import logging
import threading
from datetime import datetime
from typing import Dict, Any
from config import TRIVY_PATH, SCAN_TIMEOUT
from types import ScanResult, VulnerabilityCount
from security import validate_image_name, sanitize_input

logger = logging.getLogger("k8s-dashboard")


def scan_image(image_name: str) -> ScanResult:
    """Scan a Docker image for vulnerabilities using Trivy."""
    try:
        # Validate input
        if not validate_image_name(image_name):
            raise ValueError(f"Invalid image name format: {image_name}")
        
        # Run Trivy scan
        cmd = [
            TRIVY_PATH,
            "image",
            "--format", "json",
            "--quiet",
            image_name
        ]
        
        logger.info(f"🔍 Starting security scan for image: {image_name}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=SCAN_TIMEOUT
        )
        
        if result.returncode != 0:
            error_msg = result.stderr.strip() if result.stderr else "Unknown error"
            logger.error(f"❌ Trivy scan failed: {error_msg}")
            raise RuntimeError(f"Security scan failed: {error_msg}")
        
        # Parse JSON results
        try:
            scan_data = json.loads(result.stdout)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse Trivy JSON output: {str(e)}")
            raise RuntimeError("Failed to parse scan results")
        
        # Count vulnerabilities by severity
        vuln_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        
        if scan_data and isinstance(scan_data, list) and len(scan_data) > 0:
            for result in scan_data:
                if "Vulnerabilities" in result and isinstance(result["Vulnerabilities"], list):
                    for vuln in result["Vulnerabilities"]:
                        severity = vuln.get("Severity", "").lower()
                        if severity in vuln_counts:
                            vuln_counts[severity] += 1
        
        logger.info(f"✅ Scan completed for {image_name}: {vuln_counts}")
        
        return {
            "image": image_name,
            "timestamp": datetime.now().isoformat(),
            "vulnerabilities": vuln_counts,
            "details": scan_data
        }
        
    except subprocess.TimeoutExpired:
        logger.error(f"❌ Security scan timed out for {image_name}")
        raise RuntimeError(f"Security scan timed out after {SCAN_TIMEOUT} seconds")
    except Exception as e:
        logger.error(f"❌ Error during security scan: {str(e)}")
        raise


def get_scan_summary(image_name: str) -> Dict[str, Any]:
    """Get a summary of the latest scan for an image."""
    try:
        scan_result = scan_image(image_name)
        
        return {
            "image": scan_result["image"],
            "timestamp": scan_result["timestamp"],
            "vulnerabilities": scan_result["vulnerabilities"],
            "total_vulnerabilities": sum(scan_result["vulnerabilities"].values()),
            "has_critical": scan_result["vulnerabilities"]["critical"] > 0,
            "has_high": scan_result["vulnerabilities"]["high"] > 0
        }
    except Exception as e:
        logger.error(f"❌ Error getting scan summary: {str(e)}")
        return {
            "image": image_name,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


def export_scan_results(scan_data: Dict[str, Any], format_type: str = "json") -> str:
    """Export scan results in specified format."""
    try:
        if format_type.lower() == "json":
            return json.dumps(scan_data, indent=2)
        elif format_type.lower() == "csv":
            # Simple CSV export for vulnerabilities
            if "details" in scan_data and isinstance(scan_data["details"], list):
                csv_lines = ["Severity,Vulnerability,Package,Installed Version,Fixed Version"]
                
                for result in scan_data["details"]:
                    if "Vulnerabilities" in result:
                        for vuln in result["Vulnerabilities"]:
                            csv_lines.append(f"{vuln.get('Severity', '')},"
                                           f"{vuln.get('VulnerabilityID', '')},"
                                           f"{vuln.get('PkgName', '')},"
                                           f"{vuln.get('InstalledVersion', '')},"
                                           f"{vuln.get('FixedVersion', '')}")
                
                return "\n".join(csv_lines)
            else:
                return "No vulnerability data available for CSV export"
        else:
            raise ValueError(f"Unsupported export format: {format_type}")
            
    except Exception as e:
        logger.error(f"❌ Error exporting scan results: {str(e)}")
        return f"Error exporting results: {str(e)}"
