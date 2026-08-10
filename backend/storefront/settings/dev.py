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

import dj_database_url

# Development Database (Supports DATABASE_URL, MySQL, or fallback SQLite)
if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.config(conn_max_age=600, ssl_require=False)
    }
else:
    try:
        import MySQLdb
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.mysql',
                'NAME': 'storefront2',
                'HOST': 'localhost',
                'USER': 'root',
                'PASSWORD': 'Mseum017?',
            }
        }
    except Exception:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/1')
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
        "LOCATION": os.environ.get('REDIS_CACHE_URL', 'redis://127.0.0.1:6379/2'),
    }
}

# Email Settings
if os.environ.get('EMAIL_HOST'):
    EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
    EMAIL_HOST = os.environ.get('EMAIL_HOST')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
    EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() in ['true', '1']
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
    DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'VibeMart <mostofaseum8@gmail.com>')
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'VibeMart <noreply@vibemart.com>'