"""
Idempotency Utilities for Preventing Duplicate Submissions (e.g., Double Orders/Payments)
"""
import functools
import hashlib
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status


def idempotent_action(timeout=300, key_header='Idempotency-Key'):
    """
    Decorator for DRF viewset actions or API views to ensure idempotency.
    If an 'Idempotency-Key' header is provided:
      - Checks cache for a previously cached successful response.
      - If found, returns the cached response immediately without re-executing logic.
      - If not found, executes the view and caches successful responses (2xx/3xx) for `timeout` seconds.
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def _wrapped_view(view_instance, request, *args, **kwargs):
            idempotency_key = request.headers.get(key_header) or request.META.get(f'HTTP_{key_header.upper().replace("-", "_")}')
            
            if not idempotency_key:
                return view_func(view_instance, request, *args, **kwargs)

            # Build a deterministic cache key with user context or guest IP
            user_identifier = request.user.id if request.user and request.user.is_authenticated else request.META.get('REMOTE_ADDR', 'anon')
            cache_key = f"idempotency_{hashlib.sha256(f'{user_identifier}_{idempotency_key}'.encode()).hexdigest()}"

            cached_entry = cache.get(cache_key)
            if cached_entry is not None:
                response = Response(
                    data=cached_entry.get('data'),
                    status=cached_entry.get('status', status.HTTP_200_OK),
                    headers={'X-Cache-Lookup': 'HIT', 'Idempotent-Replay': 'true'}
                )
                return response

            # Execute actual request
            response = view_func(view_instance, request, *args, **kwargs)

            # Cache successful responses
            if 200 <= response.status_code < 400:
                try:
                    cache.set(
                        cache_key,
                        {
                            'data': response.data,
                            'status': response.status_code
                        },
                        timeout=timeout
                    )
                except Exception:
                    pass  # Non-blocking if cache is temporarily unavailable

            return response
        return _wrapped_view
    return decorator
