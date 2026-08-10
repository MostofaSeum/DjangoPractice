import random
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta
from .models import User, OTPToken

@api_view(['POST'])
@permission_classes([AllowAny])
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

        # Send email
        subject = "Your VibeMart Verification Code"
        message = f"Your one-time verification code is: {otp_code}\n\nThis code will expire in 5 minutes. Do not share it with anyone."
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vibemart.com')

        send_mail(subject, message, from_email, [email], fail_silently=False)

        return Response({'detail': 'Verification code sent to your email!'}, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        print("send_otp Error:", traceback.format_exc())
        return Response({'error': f"Server error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
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

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
        }
    }, status=status.HTTP_200_OK)
