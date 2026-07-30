import random
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTPToken

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    email = request.data.get('email')
    username = request.data.get('username')

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate if user with this email or username already exists (when registering)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    if username and User.objects.filter(username=username).exists():
        return Response({'error': 'Username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)

    # Generate 6-digit random code
    otp_code = f"{random.randint(100000, 999999)}"

    # Invalidate previous unused OTPs for this email
    OTPToken.objects.filter(email=email, is_used=False).update(is_used=True)

    # Save new OTP
    OTPToken.objects.create(email=email, otp_code=otp_code)

    # Send email
    subject = "Your VibeMart Login Verification Code"
    message = f"Your one-time login verification code is: {otp_code}\n\nThis code will expire in 5 minutes. Do not share it with anyone."
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vibemart.com')

    try:
        send_mail(subject, message, from_email, [email], fail_silently=True)
    except Exception as e:
        print("Email sending error:", e)

    # Also log to console for dev environment testing
    print(f"\n==========================================")
    print(f" [OTP CODE] Sent to {email}: {otp_code}")
    print(f"==========================================\n")

    return Response({'detail': 'Verification code sent to your email!'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    otp_code = request.data.get('otp_code')

    if not email or not otp_code:
        return Response({'error': 'Email and OTP code are required'}, status=status.HTTP_400_BAD_REQUEST)

    otp_entry = OTPToken.objects.filter(email=email, is_used=False).order_by('-created_at').first()

    if not otp_entry or otp_entry.otp_code != str(otp_code).strip() or not otp_entry.is_valid():
        return Response({'error': 'Invalid or expired verification code'}, status=status.HTTP_400_BAD_REQUEST)

    # Mark OTP as used
    otp_entry.is_used = True
    otp_entry.save()

    # Get or create user
    base_username = email.split('@')[0]
    user = User.objects.filter(email=email).first()
    if not user:
        # Generate unique username if username already exists
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        user = User.objects.create_user(username=username, email=email)

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
