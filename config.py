import os
from typing import List

# Configuration from environment variables
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False") == "True"
API_PORT = int(os.getenv("API_PORT", "5000"))
METRICS_INTERVAL = int(os.getenv("METRICS_INTERVAL", "5"))  # In seconds
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000").split(",")

# Rate limiting configuration
RATE_LIMITS = ["200 per day", "50 per hour"]

# Metrics history configuration
METRICS_HISTORY_LIMIT = 100

# Kubernetes configuration
KUBE_CONFIG_PATH = os.getenv("KUBE_CONFIG_PATH", None)

# Security scanning configuration
TRIVY_PATH = os.getenv("TRIVY_PATH", "trivy")
SCAN_TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "300"))  # 5 minutes
