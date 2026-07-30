from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    email = models.EmailField(unique=True)

class OTPToken(models.Model):
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        now = timezone.now()
        diff = now - self.created_at
        return not self.is_used and diff.total_seconds() <= 300

    def __str__(self):
        return f"OTP {self.otp_code} for {self.email}"
