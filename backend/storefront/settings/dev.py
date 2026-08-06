import os
from .common import *

SECRET_KEY = 'django-insecure-hs6j037urx6iav+7#10%-vu4l4f5@@-1_zo)oft4g7$vf2$jmp'

DEBUG = True

ALLOWED_HOSTS = ['*']

# Development apps & middleware
INSTALLED_APPS += [
    'debug_toolbar',
    'silk',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
    'silk.middleware.SilkyMiddleware',
] + [m for m in MIDDLEWARE if m not in ('corsheaders.middleware.CorsMiddleware', 'debug_toolbar.middleware.DebugToolbarMiddleware', 'silk.middleware.SilkyMiddleware')]

INTERNAL_IPS = [
    '127.0.0.1',
]

# Development Database (MySQL local with fallback)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'storefront2',
        'HOST': 'localhost',
        'USER': 'root',
        'PASSWORD': 'Mseum017?',
    }
}

CELERY_BROKER_URL = 'redis://localhost:6379/1'
CELERY_BEAT_SCHEDULE = {
    'notify customers': {
        'task': 'playground.task.notify_customers',
        'schedule': 5,
        'args': ['Hello from Celery Beat'],
    }
}

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/2",
    }
}

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = 'VibeMart <noreply@vibemart.com>'