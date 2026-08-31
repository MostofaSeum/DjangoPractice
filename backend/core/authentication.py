from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that checks both:
    1. Authorization header: 'JWT <token>' or 'Bearer <token>'
    2. HttpOnly Cookie: 'access_token'
    """
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            # Fallback to reading access_token from HttpOnly cookie
            raw_token = request.COOKIES.get('access_token')
            if raw_token is None:
                return None
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        
        # If header is present, authenticate standard way
        return super().authenticate(request)
