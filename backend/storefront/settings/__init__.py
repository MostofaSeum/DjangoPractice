import os

# Default to dev settings if not explicitly specified
settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', '')
if settings_module.endswith('prod'):
    from .prod import *
else:
    from .dev import *
