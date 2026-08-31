"""
Signed Webhook Verification Utilities (HMAC-SHA256)
"""
import hmac
import hashlib
from django.conf import settings
from rest_framework.exceptions import PermissionDenied


def verify_webhook_signature(payload_bytes: bytes, signature_header: str, secret_key: str = None) -> bool:
    """
    Verifies that the incoming webhook payload was signed with the expected HMAC-SHA256 secret.
    """
    secret = secret_key or getattr(settings, 'WEBHOOK_SECRET', settings.SECRET_KEY)
    if isinstance(secret, str):
        secret = secret.encode('utf-8')
    
    if not signature_header:
        return False

    computed_sig = hmac.new(secret, payload_bytes, hashlib.sha256).hexdigest()
    
    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(computed_sig, signature_header.strip())


def require_signed_webhook(secret_key: str = None, header_name: str = 'X-Webhook-Signature'):
    """
    Decorator for views that receive external webhook callbacks (e.g. bKash, Nagad, SSLCommerz).
    Ensures that only authentic, signed webhooks are executed.
    """
    def decorator(view_func):
        def _wrapped_view(view_instance_or_request, *args, **kwargs):
            request = getattr(view_instance_or_request, 'request', view_instance_or_request)
            signature = request.headers.get(header_name) or request.META.get(f'HTTP_{header_name.upper().replace("-", "_")}')
            
            payload_body = getattr(request, '_body', None) or getattr(request, 'body', b'')
            
            if not signature or not verify_webhook_signature(payload_body, signature, secret_key):
                raise PermissionDenied("Invalid or missing webhook signature.")

            return view_func(view_instance_or_request, *args, **kwargs)
        return _wrapped_view
    return decorator
