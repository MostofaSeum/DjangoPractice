import os
import dj_database_url
from .common import *

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-prod-key-fallback-change-in-env')

DEBUG = os.environ.get('DEBUG', 'False').lower() in ['true', '1']

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split()

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

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')
CELERY_BROKER_URL = REDIS_URL

try:
    import django_redis
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": os.environ.get('REDIS_CACHE_URL', REDIS_URL),
        }
    }
except ImportError:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
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
