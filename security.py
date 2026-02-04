from typing import Any
from flask import Response


def add_security_headers(response: Response) -> Response:
    """Add security headers to the response."""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
        "img-src 'self' data:;"
    )
    return response


def sanitize_input(input_str: str) -> str:
    """Basic input sanitization."""
    if not input_str:
        return ""
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', '\x00']
    for char in dangerous_chars:
        input_str = input_str.replace(char, '')
    return input_str.strip()


def validate_image_name(image_name: str) -> bool:
    """Validate Docker image name format."""
    if not image_name or len(image_name) > 255:
        return False
    
    # Basic Docker image name validation
    # Allows: repository/image:tag format
    import re
    pattern = r'^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[a-zA-Z0-9][a-zA-Z0-9._-]*)?$'
    return bool(re.match(pattern, image_name.lower()))
