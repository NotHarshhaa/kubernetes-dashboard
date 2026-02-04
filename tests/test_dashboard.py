# Unit Tests for Kubernetes Dashboard

import pytest
import json
from unittest.mock import MagicMock, patch
from flask import Flask

# Import the modules to test
from dashboard_types import KubernetesInfo, PodStatus
from kubernetes_client import get_resource_counts, init_kubernetes
from security import sanitize_input, validate_image_name
from security_scanner import clear_scan_cache, get_scan_summary, scan_image
from system_monitor import clear_metrics_cache, get_metrics_history, get_system_metrics


class TestSystemMonitor:
    """Test system monitoring functionality."""

    def test_get_system_metrics(self):
        """Test system metrics collection."""
        with patch("system_monitor.psutil") as mock_psutil:
            # Mock psutil responses
            def cpu_percent_side_effect(interval=None, percpu=False):
                if percpu:
                    return [25.0, 25.0, 25.0, 25.0]
                else:
                    return 50.0

            mock_psutil.cpu_percent.side_effect = cpu_percent_side_effect
            mock_psutil.cpu_count.return_value = 4
            mock_psutil.cpu_freq.return_value = MagicMock(
                current=2000.0, min=1000.0, max=3000.0
            )

            mock_memory = MagicMock()
            mock_memory.total = 8589934592  # 8GB
            mock_memory.available = 4294967296  # 4GB
            mock_memory.used = 4294967296  # 4GB
            mock_memory.percent = 50.0
            mock_psutil.virtual_memory.return_value = mock_memory

            mock_disk = MagicMock()
            mock_disk.total = 107374182400  # 100GB
            mock_disk.used = 53687091200  # 50GB
            mock_disk.free = 53687091200  # 50GB
            mock_disk.percent = 50.0
            mock_psutil.disk_usage.return_value = mock_disk

            mock_psutil.boot_time.return_value = 1640995200

            mock_psutil.platform.platform.return_value = "Linux-5.15.0"
            mock_psutil.platform.architecture.return_value = ("x86_64", "")
            mock_psutil.platform.machine.return_value = "x86_64"

            metrics = get_system_metrics()

            assert metrics["cpu_percent"] == 50.0
            assert metrics["memory_usage"]["percent"] == 50.0
            assert metrics["disk_usage"]["percent"] == 50.0
            assert "system_info" in metrics
            assert "timestamp" in metrics

    def test_get_metrics_history(self):
        """Test metrics history retrieval."""
        history = get_metrics_history()

        assert "cpu" in history
        assert "memory" in history
        assert "disk" in history
        assert "timestamp" in history
        assert isinstance(history["cpu"], list)
        assert isinstance(history["memory"], list)
        assert isinstance(history["disk"], list)
        assert isinstance(history["timestamp"], list)

    def test_clear_metrics_cache(self):
        """Test cache clearing."""
        # This should not raise any exceptions
        clear_metrics_cache()
        assert True  # If we reach here, the function worked


class TestSecurityScanner:
    """Test security scanning functionality."""

    @patch("security_scanner.subprocess.run")
    @patch("security_scanner.validate_image_name")
    def test_scan_image_success(self, mock_validate, mock_subprocess):
        """Test successful image scanning."""
        mock_validate.return_value = True

        # Mock successful Trivy scan
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = json.dumps(
            [
                {
                    "Vulnerabilities": [
                        {"Severity": "CRITICAL"},
                        {"Severity": "HIGH"},
                        {"Severity": "MEDIUM"},
                    ]
                }
            ]
        )

        # Mock version check
        mock_version_check = MagicMock(returncode=0)
        mock_subprocess.side_effect = [mock_version_check, mock_result]

        result = scan_image("nginx:latest")

        assert result["image"] == "nginx:latest"
        assert result["vulnerabilities"]["critical"] == 1
        assert result["vulnerabilities"]["high"] == 1
        assert result["vulnerabilities"]["medium"] == 1
        assert "timestamp" in result

    def test_scan_image_invalid_name(self):
        """Test scanning with invalid image name."""
        with pytest.raises(ValueError):
            scan_image("invalid@image@name")

    def test_get_scan_summary(self):
        """Test scan summary generation."""
        with patch("security_scanner.scan_image") as mock_scan:
            mock_scan.return_value = {
                "image": "nginx:latest",
                "timestamp": "2023-01-01T00:00:00",
                "vulnerabilities": {"critical": 1, "high": 1, "medium": 1, "low": 0},
                "total_vulnerabilities": 3,
            }

            summary = get_scan_summary("nginx:latest")

            assert summary["image"] == "nginx:latest"
            assert summary["total_vulnerabilities"] == 3
            assert summary["has_critical"] == True
            assert summary["has_high"] == True


class TestSecurity:
    """Test security utilities."""

    def test_sanitize_input(self):
        """Test input sanitization."""
        assert sanitize_input("normal_input") == "normal_input"
        assert sanitize_input("input<script>") == "inputscript"
        assert sanitize_input("input'\"&") == "input"
        assert sanitize_input("") == ""
        assert sanitize_input(None) == ""

    def test_validate_image_name(self):
        """Test image name validation."""
        # Valid names
        assert validate_image_name("nginx:latest") == True
        assert validate_image_name("ubuntu:20.04") == True
        assert validate_image_name("myrepo/myimage:v1.0") == True

        # Invalid names
        assert validate_image_name("invalid@image") == False
        assert validate_image_name("") == False
        assert validate_image_name("image with spaces") == False
        assert validate_image_name("a" * 256) == False


class TestKubernetesClient:
    """Test Kubernetes client functionality."""

    @patch("kubernetes_client.config")
    @patch("kubernetes_client.client")
    def test_init_kubernetes_success(self, mock_client, mock_config):
        """Test successful Kubernetes initialization."""
        mock_config.load_kube_config.return_value = None
        mock_core_v1 = MagicMock()
        mock_apps_v1 = MagicMock()
        mock_client.CoreV1Api.return_value = mock_core_v1
        mock_client.AppsV1Api.return_value = mock_apps_v1

        # Mock successful namespace list
        mock_core_v1.list_namespace.return_value = MagicMock()

        result = init_kubernetes()

        assert result == True
        mock_config.load_kube_config.assert_called_once()

    @patch("kubernetes_client.config")
    def test_init_kubernetes_failure(self, mock_config):
        """Test Kubernetes initialization failure."""
        # Reset global state
        import kubernetes_client

        kubernetes_client._k8s_available = False
        kubernetes_client._core_v1 = None
        kubernetes_client._apps_v1 = None
        kubernetes_client._last_init_attempt = 0

        mock_config.load_kube_config.side_effect = Exception("Config not found")
        mock_config.load_incluster_config.side_effect = Exception(
            "In-cluster config not found"
        )

        result = init_kubernetes()

        assert result == False

    @patch("kubernetes_client.get_k8s_clients")
    def test_get_resource_counts(self, mock_clients):
        """Test resource count retrieval."""
        # Reset global state to make Kubernetes available
        import kubernetes_client

        kubernetes_client._k8s_available = True

        mock_core_v1, mock_apps_v1 = MagicMock(), MagicMock()
        mock_clients.return_value = (mock_core_v1, mock_apps_v1)

        # Mock API responses
        mock_apps_v1.list_namespaced_deployment.return_value = MagicMock(
            items=[1, 2, 3]
        )
        mock_core_v1.list_namespaced_service.return_value = MagicMock(items=[1, 2])
        mock_core_v1.list_namespaced_pod.return_value = MagicMock(items=[1, 2, 3, 4])

        with patch("kubernetes_client.get_pod_status_counts") as mock_status:
            mock_status.return_value = {
                "running": 4,
                "pending": 0,
                "failed": 0,
                "succeeded": 0,
                "unknown": 0,
            }

            result = get_resource_counts("default")

            assert result["namespace"] == "default"
            assert result["num_deployments"] == 3
            assert result["num_services"] == 2
            assert result["num_pods"] == 4


class TestAPIEndpoints:
    """Test API endpoints."""

    def setup_method(self):
        """Set up test Flask app."""
        self.app = Flask(__name__)
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        # Import and register routes
        from routes import app as flask_app

        self.app = flask_app
        self.client = self.app.test_client()

    @patch("routes.get_system_metrics")
    def test_system_info_endpoint(self, mock_metrics):
        """Test system info endpoint."""
        mock_metrics.return_value = {
            "cpu_percent": 50.0,
            "memory_usage": {"percent": 60.0},
            "disk_usage": {"percent": 70.0},
        }

        response = self.client.get("/system_info")

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["cpu_percent"] == 50.0

    @patch("routes.scan_image")
    def test_scan_image_endpoint(self, mock_scan):
        """Test scan image endpoint."""
        mock_scan.return_value = {
            "image": "nginx:latest",
            "vulnerabilities": {"critical": 0, "high": 1, "medium": 2, "low": 3},
        }

        response = self.client.post(
            "/scan_image",
            json={"image": "nginx:latest"},
            content_type="application/json",
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["image"] == "nginx:latest"

    def test_scan_image_endpoint_missing_input(self):
        """Test scan image endpoint with missing input."""
        response = self.client.post(
            "/scan_image", json={}, content_type="application/json"
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
