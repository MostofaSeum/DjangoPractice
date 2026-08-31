import os
import requests
import random
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.throttling import ScopedRateThrottle
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, OTPToken

class AuthBurstThrottle(ScopedRateThrottle):
    throttle_scope = 'auth_burst'


class CookieTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint that issues JWT tokens and sets them as HttpOnly cookies.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            is_secure = not settings.DEBUG

            # Set HttpOnly Cookie for Access Token (1 day)
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=is_secure,
                samesite='Lax',
                max_age=60 * 60 * 24,
                path='/'
            )
            # Set HttpOnly Cookie for Refresh Token (7 days)
            response.set_cookie(
                key='refresh_token',
                value=refresh_token,
                httponly=True,
                secure=is_secure,
                samesite='Lax',
                max_age=60 * 60 * 24 * 7,
                path='/'
            )
        return response


class CookieTokenRefreshView(TokenRefreshView):
    """
    Refresh endpoint that reads refresh_token from body OR HttpOnly cookie,
    and updates the access_token HttpOnly cookie.
    """
    def post(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, 'copy') else {}
        if not data.get('refresh'):
            cookie_refresh = request.COOKIES.get('refresh_token')
            if cookie_refresh:
                data['refresh'] = cookie_refresh
                request._full_data = data

        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            access_token = response.data.get('access')
            is_secure = not settings.DEBUG
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=is_secure,
                samesite='Lax',
                max_age=60 * 60 * 24,
                path='/'
            )
        return response


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    Logout endpoint that clears HttpOnly cookies.
    """
    response = Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthBurstThrottle])
def send_otp(request):
    try:
        email = request.data.get('email')
        username = request.data.get('username')

        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate if user with this email or username already exists
        if User.objects.filter(email=email).exists():
            return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        if username and User.objects.filter(username=username).exists():
            return Response({'error': 'Username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)

        # Clean up any expired OTP tokens older than 5 minutes from DB
        five_minutes_ago = timezone.now() - timedelta(minutes=5)
        OTPToken.objects.filter(created_at__lt=five_minutes_ago).delete()

        # Delete any existing OTP tokens for this email to prevent leftover data
        OTPToken.objects.filter(email=email).delete()

        # Generate 6-digit random code
        otp_code = f"{random.randint(100000, 999999)}"

        # Save new OTP
        OTPToken.objects.create(email=email, otp_code=otp_code)

        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'mostofa.seum@brainicontech.com')
        # Clean from_email if it contains name like "VibeMart <email>"
        clean_from_email = from_email.split('<')[-1].replace('>', '').strip() if '<' in from_email else from_email

        sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
        sender_api_key = os.environ.get('SENDER_NET_API_KEY')
        brevo_api_key = os.environ.get('BREVO_API_KEY')

        # 1. Send via SendGrid HTTPS API on Port 443 (Single Sender Verification - No Domain DNS Required!)
        if sendgrid_api_key and sendgrid_api_key.startswith('SG.'):
            api_url = "https://api.sendgrid.com/v3/mail/send"
            headers = {
                "Authorization": f"Bearer {sendgrid_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "personalizations": [{"to": [{"email": email}]}],
                "from": {"name": "VibeMart", "email": clean_from_email},
                "subject": "Your VibeMart Verification Code",
                "content": [{
                    "type": "text/html",
                    "value": f"""
                        <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px;">
                            <h2 style="color: #111; margin-top: 0;">VibeMart Verification Code</h2>
                            <p style="font-size: 14px; color: #555;">Your one-time verification code is:</p>
                            <div style="background: #111; color: #fff; padding: 14px; border-radius: 12px; font-family: monospace; font-size: 28px; font-weight: 900; letter-spacing: 6px; text-align: center; margin: 20px 0;">
                                {otp_code}
                            </div>
                            <p style="font-size: 12px; color: #777;">This code will expire in 5 minutes. Do not share it with anyone.</p>
                        </div>
                    """
                }]
            }
            res = requests.post(api_url, json=payload, headers=headers, timeout=10)
            if res.status_code not in [200, 201, 202]:
                raise Exception(f"SendGrid API Error ({res.status_code}): {res.text}")

        # 2. Send via Sender.net HTTPS API on Port 443
        elif sender_api_key:
            api_url = "https://api.sender.net/v2/email/send"
            headers = {
                "Authorization": f"Bearer {sender_api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            payload = {
                "from": {"name": "VibeMart", "email": clean_from_email},
                "to": [{"email": email}],
                "subject": "Your VibeMart Verification Code",
                "html": f"""
                    <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px;">
                        <h2 style="color: #111; margin-top: 0;">VibeMart Verification Code</h2>
                        <p style="font-size: 14px; color: #555;">Your one-time verification code is:</p>
                        <div style="background: #111; color: #fff; padding: 14px; border-radius: 12px; font-family: monospace; font-size: 28px; font-weight: 900; letter-spacing: 6px; text-align: center; margin: 20px 0;">
                            {otp_code}
                        </div>
                        <p style="font-size: 12px; color: #777;">This code will expire in 5 minutes. Do not share it with anyone.</p>
                    </div>
                """
            }
            res = requests.post(api_url, json=payload, headers=headers, timeout=10)
            if res.status_code not in [200, 201, 202]:
                raise Exception(f"Sender.net API Error ({res.status_code}): {res.text}")

        # 2. Send via Brevo HTTPS API on Port 443
        elif brevo_api_key and brevo_api_key.startswith('xkeysib-'):
            api_url = "https://api.brevo.com/v3/smtp/email"
            headers = {
                "accept": "application/json",
                "api-key": brevo_api_key,
                "content-type": "application/json"
            }
            payload = {
                "sender": {"name": "VibeMart", "email": clean_from_email},
                "to": [{"email": email}],
                "subject": "Your VibeMart Verification Code",
                "htmlContent": f"""
                    <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px;">
                        <h2 style="color: #111; margin-top: 0;">VibeMart Verification Code</h2>
                        <p style="font-size: 14px; color: #555;">Your one-time verification code is:</p>
                        <div style="background: #111; color: #fff; padding: 14px; border-radius: 12px; font-family: monospace; font-size: 28px; font-weight: 900; letter-spacing: 6px; text-align: center; margin: 20px 0;">
                            {otp_code}
                        </div>
                        <p style="font-size: 12px; color: #777;">This code will expire in 5 minutes. Do not share it with anyone.</p>
                    </div>
                """
            }
            res = requests.post(api_url, json=payload, headers=headers, timeout=10)
            if res.status_code not in [200, 201, 202]:
                raise Exception(f"Brevo API Error ({res.status_code}): {res.text}")
        else:
            # Fallback to standard Django SMTP send_mail
            subject = "Your VibeMart Verification Code"
            message = f"Your one-time verification code is: {otp_code}\n\nThis code will expire in 5 minutes. Do not share it with anyone."
            send_mail(subject, message, clean_from_email, [email], fail_silently=False)

        return Response({'detail': 'Verification code sent to your email!'}, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        print("send_otp Error:", traceback.format_exc())
        return Response({'error': f"Server error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthBurstThrottle])
def verify_otp(request):
    email = request.data.get('email')
    otp_code = request.data.get('otp_code')
    username_req = request.data.get('username')
    password_req = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')

    if not email or not otp_code:
        return Response({'error': 'Email and OTP code are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Clean up any expired OTP tokens older than 5 minutes from DB
    five_minutes_ago = timezone.now() - timedelta(minutes=5)
    OTPToken.objects.filter(created_at__lt=five_minutes_ago).delete()

    otp_entry = OTPToken.objects.filter(email=email, is_used=False).order_by('-created_at').first()

    if not otp_entry or otp_entry.otp_code != str(otp_code).strip() or not otp_entry.is_valid():
        if otp_entry and not otp_entry.is_valid():
            otp_entry.delete()
        return Response({'error': 'Invalid or expired verification code'}, status=status.HTTP_400_BAD_REQUEST)

    # Delete the OTP token after successful verification
    otp_entry.delete()

    # Get or create user
    user = User.objects.filter(email=email).first()
    if not user:
        base_username = username_req or email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password_req,
            first_name=first_name,
            last_name=last_name
        )
    elif password_req:
        user.set_password(password_req)
        if first_name: user.first_name = first_name
        if last_name: user.last_name = last_name
        user.save()

    # Issue JWT tokens
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    response = Response({
        'access': access_token,
        'refresh': refresh_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
        }
    }, status=status.HTTP_200_OK)

    # Also attach HttpOnly cookies
    is_secure = not settings.DEBUG
    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite='Lax',
        max_age=60 * 60 * 24,
        path='/'
    )
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite='Lax',
        max_age=60 * 60 * 24 * 7,
        path='/'
    )
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthBurstThrottle])
def reset_password(request):
    try:
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not username or not email:
            return Response(
                {'error': 'Username and email are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Look for user matching both username and email (case-insensitive for email)
        try:
            user = User.objects.get(username=username, email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'No matching account found with the provided username and email.'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # If passwords are not supplied, it is a verification check
        if not new_password:
            return Response(
                {'detail': 'Account verified. You can now set your new password.'}, 
                status=status.HTTP_200_OK
            )

        # Password matching check
        if new_password != confirm_password:
            return Response(
                {'error': 'New password and confirm password do not match.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Django password validation (length, complexity, similarity)
        try:
            validate_password(new_password, user=user)
        except ValidationError as e:
            return Response(
                {'error': e.messages}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update password
        user.set_password(new_password)
        user.save()

        return Response(
            {'detail': 'Password has been successfully changed! You can now sign in.'}, 
            status=status.HTTP_200_OK
        )

    except Exception as e:
        import traceback
        print("reset_password Error:", traceback.format_exc())
        return Response(
            {'error': f"Server error: {str(e)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
