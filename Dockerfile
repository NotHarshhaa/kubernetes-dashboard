# Use Python 3.9 slim image as base
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=app.py \
    FLASK_ENV=production \
    API_PORT=5000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Trivy for security scanning
RUN TRIVY_VERSION=$(curl -s https://api.github.com/repos/aquasecurity/trivy/releases/latest | grep '"tag_name":' | cut -d '"' -f 4) \
    && wget -qO /tmp/trivy_${TRIVY_VERSION}_linux_amd64.tar.gz https://github.com/aquasecurity/trivy/releases/download/trivy_${TRIVY_VERSION}_linux_amd64.tar.gz \
    && tar -xzf /tmp/trivy_${TRIVY_VERSION}_linux_amd64.tar.gz -C /tmp/ \
    && mv /tmp/trivy /usr/local/bin/trivy \
    && chmod +x /usr/local/bin/trivy \
    && rm -f /tmp/trivy_${TRIVY_VERSION}_linux_amd64.tar.gz

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Expose port
EXPOSE 5000

# Start the application
CMD ["python", "app.py"]
