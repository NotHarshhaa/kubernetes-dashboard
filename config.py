import os
from typing import List, Optional

# Configuration from environment variables
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "False") == "True"
API_PORT = int(os.getenv("API_PORT", "5000"))
METRICS_INTERVAL = int(os.getenv("METRICS_INTERVAL", "5"))  # In seconds
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000").split(",")

# Rate limiting configuration
RATE_LIMITS = ["200 per day", "50 per hour"]

# Metrics history configuration
METRICS_HISTORY_LIMIT = int(os.getenv("METRICS_HISTORY_LIMIT", "100"))

# Kubernetes configuration
KUBE_CONFIG_PATH = os.getenv("KUBE_CONFIG_PATH", None)
K8S_TIMEOUT = int(os.getenv("K8S_TIMEOUT", "10"))  # API timeout in seconds

# Security scanning configuration
TRIVY_PATH = os.getenv("TRIVY_PATH", "trivy")
SCAN_TIMEOUT = int(os.getenv("SCAN_TIMEOUT", "300"))  # 5 minutes
SCAN_CACHE_DURATION = int(os.getenv("SCAN_CACHE_DURATION", "3600"))  # 1 hour
MAX_CONCURRENT_SCANS = int(os.getenv("MAX_CONCURRENT_SCANS", "3"))

# System monitoring configuration
SYSTEM_CACHE_DURATION = int(os.getenv("SYSTEM_CACHE_DURATION", "5"))  # seconds
CPU_INTERVAL = float(os.getenv("CPU_INTERVAL", "0.1"))  # seconds for psutil calls

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ENABLE_SECURITY_HEADERS = os.getenv("ENABLE_SECURITY_HEADERS", "True") == "True"
ENABLE_CORS = os.getenv("ENABLE_CORS", "True") == "True"

# Performance configuration
ENABLE_METRICS_CACHE = os.getenv("ENABLE_METRICS_CACHE", "True") == "True"
ENABLE_SCAN_CACHE = os.getenv("ENABLE_SCAN_CACHE", "True") == "True"
MAX_WORKERS = int(os.getenv("MAX_WORKERS", "4"))

# Logging configuration
LOG_FILE = os.getenv("LOG_FILE", None)
LOG_MAX_SIZE = int(os.getenv("LOG_MAX_SIZE", "10485760"))  # 10MB
LOG_BACKUP_COUNT = int(os.getenv("LOG_BACKUP_COUNT", "5"))

# Feature flags
ENABLE_KUBERNETES = os.getenv("ENABLE_KUBERNETES", "True") == "True"
ENABLE_SECURITY_SCANNING = os.getenv("ENABLE_SECURITY_SCANNING", "True") == "True"
ENABLE_LOG_VIEWER = os.getenv("ENABLE_LOG_VIEWER", "True") == "True"

# Development/Production environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT.lower() == "production"

# Database/Cache configuration (for future enhancements)
REDIS_URL = os.getenv("REDIS_URL", None)
CACHE_TYPE = os.getenv("CACHE_TYPE", "simple")  # simple, redis, memcached

# Notification configuration
ENABLE_NOTIFICATIONS = os.getenv("ENABLE_NOTIFICATIONS", "True") == "True"
NOTIFICATION_LEVEL = os.getenv("NOTIFICATION_LEVEL", "WARNING")

# Health check configuration
HEALTH_CHECK_INTERVAL = int(os.getenv("HEALTH_CHECK_INTERVAL", "30"))  # seconds
ENABLE_DETAILED_HEALTH = os.getenv("ENABLE_DETAILED_HEALTH", "True") == "True"
