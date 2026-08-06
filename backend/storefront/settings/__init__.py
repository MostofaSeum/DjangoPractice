import os

# Auto-detect settings module based on environment
settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', '')
is_prod = (
    settings_module.endswith('prod') or
    os.environ.get('RENDER') is not None or
    os.environ.get('ENVIRONMENT') == 'production'
)

if is_prod:
    from .prod import *
else:
    from .dev import *
