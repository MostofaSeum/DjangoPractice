from django.utils import timezone
from datetime import timedelta
from .models import OTPToken

class OTPCleanupMiddleware:
    """Middleware that automatically purges OTP tokens older than 5 minutes"""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        five_minutes_ago = timezone.now() - timedelta(minutes=5)
        OTPToken.objects.filter(created_at__lt=five_minutes_ago).delete()

        response = self.get_response(request)
        return response
