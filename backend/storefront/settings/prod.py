import os
import dj_database_url
from .common import *

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-prod-key-fallback-change-in-env')

DEBUG = os.environ.get('DEBUG', 'False').lower() in ['true', '1']

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split()

# Production CORS & CSRF Settings
# Note: When CORS_ALLOW_CREDENTIALS is True, CORS_ALLOW_ALL_ORIGINS cannot be True (browser security spec)
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

cors_origins_env = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if cors_origins_env:
    CORS_ALLOWED_ORIGINS = [orig.strip() for orig in cors_origins_env.replace(',', ' ').split() if orig.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        "https://vibemart-flax.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

# Dynamic regex matching for all Vercel, Render, and Localhost origins
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
    r"^https://.*\.onrender\.com$",
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
]

# CSRF Trusted Origins for Django 4+
csrf_origins_env = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
if csrf_origins_env:
    CSRF_TRUSTED_ORIGINS = [orig.strip() for orig in csrf_origins_env.replace(',', ' ').split() if orig.strip()]
else:
    CSRF_TRUSTED_ORIGINS = [
        "https://*.vercel.app",
        "https://*.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

# Production Database via DATABASE_URL or fallback to sqlite
if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.config(conn_max_age=600, ssl_require=False)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

REDIS_URL = os.environ.get('REDIS_URL')
CELERY_BROKER_URL = REDIS_URL or 'memory://'

# Use Redis cache ONLY if REDIS_URL / REDIS_CACHE_URL is explicitly configured in environment
redis_cache_url = os.environ.get('REDIS_CACHE_URL', REDIS_URL)
if redis_cache_url:
    try:
        import django_redis
        CACHES = {
            "default": {
                "BACKEND": "django_redis.cache.RedisCache",
                "LOCATION": redis_cache_url,
            }
        }
    except ImportError:
        CACHES = {
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
                "LOCATION": "prod-locmem-cache",
            }
        }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "prod-locmem-cache",
        }
    }

# Production Email
EMAIL_HOST = os.environ.get('EMAIL_HOST')
if EMAIL_HOST:
    EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
    EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() in ['true', '1']
    EMAIL_USE_SSL = os.environ.get('EMAIL_USE_SSL', 'False').lower() in ['true', '1']
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
    EMAIL_TIMEOUT = int(os.environ.get('EMAIL_TIMEOUT', 10))
    DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'VibeMart <noreply@vibemart.com>')
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'VibeMart <noreply@vibemart.com>'
