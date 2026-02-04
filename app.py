#!/usr/bin/env python3
"""
Kubernetes Dashboard - Main Application Entry Point
Modern container orchestration monitoring and management dashboard
"""

from datetime import datetime
import logging

# Import the main application
from routes import app, logger, k8s_available

def main():
    """Main entry point for the Kubernetes Dashboard application."""
    logger.info("🚀 Starting Kubernetes Dashboard")
    logger.info(f"📅 Started at: {datetime.now().isoformat()}")
    logger.info(f"☸️  Kubernetes integration: {'✅ Available' if k8s_available else '❌ Not Available'}")
    
    try:
        # Import configuration
        from config import API_PORT, FLASK_DEBUG
        
        logger.info(f"🌐 Server will be available at: http://0.0.0.0:{API_PORT}")
        logger.info(f"🔧 Debug mode: {'✅ Enabled' if FLASK_DEBUG else '❌ Disabled'}")
        
        # Start the Flask application
        app.run(
            host='0.0.0.0',
            port=API_PORT,
            debug=FLASK_DEBUG,
            use_reloader=not FLASK_DEBUG  # Don't use reloader in production
        )
        
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down Kubernetes Dashboard...")
    except Exception as e:
        logger.error(f"❌ Failed to start application: {str(e)}")
        raise

if __name__ == '__main__':
    main()
