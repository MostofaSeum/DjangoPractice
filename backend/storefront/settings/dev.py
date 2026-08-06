import os
from .common import *

SECRET_KEY = 'django-insecure-hs6j037urx6iav+7#10%-vu4l4f5@@-1_zo)oft4g7$vf2$jmp'

DEBUG = True

ALLOWED_HOSTS = ['*']

# Development apps & middleware safely included
try:
    import debug_toolbar
    INSTALLED_APPS.append('debug_toolbar')
    MIDDLEWARE.insert(1, 'debug_toolbar.middleware.DebugToolbarMiddleware')
except ImportError:
    pass

try:
    import silk
    INSTALLED_APPS.append('silk')
    MIDDLEWARE.insert(2, 'silk.middleware.SilkyMiddleware')
except ImportError:
    pass

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