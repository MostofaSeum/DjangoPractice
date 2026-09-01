import functools
import hashlib
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from rest_framework import permissions

def validate_file_size(file):
    max_size_kb = 1024 * 2  # 2MB
    max_size_bytes = max_size_kb * 1024

    if file.size > max_size_bytes:
        raise ValidationError(f'File too large. Maximum size is {max_size_kb}KB.')


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class ViewCustomerHistoryPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_staff or request.user.has_perm('store.view_history')))


def idempotent_action(timeout=300, key_header='Idempotency-Key'):
    """
    Decorator for DRF viewset actions or API views to ensure idempotency.
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def _wrapped_view(view_instance, request, *args, **kwargs):
            idempotency_key = request.headers.get(key_header) or request.META.get(f'HTTP_{key_header.upper().replace("-", "_")}')
            
            if not idempotency_key:
                return view_func(view_instance, request, *args, **kwargs)

            user_identifier = request.user.id if request.user and request.user.is_authenticated else request.META.get('REMOTE_ADDR', 'anon')
            cache_key = f"idempotency_{hashlib.sha256(f'{user_identifier}_{idempotency_key}'.encode()).hexdigest()}"

            cached_entry = cache.get(cache_key)
            if cached_entry is not None:
                return Response(
                    data=cached_entry.get('data'),
                    status=cached_entry.get('status', status.HTTP_200_OK),
                    headers={'X-Cache-Lookup': 'HIT', 'Idempotent-Replay': 'true'}
                )

            response = view_func(view_instance, request, *args, **kwargs)

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
                    pass

            return response
        return _wrapped_view
    return decorator
