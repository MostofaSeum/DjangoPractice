import os
from .common import *

SECRET_KEY = os.environ['SECRET_KEY']
DEBUG = False

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'vibemart-n9og.onrender.com',
]
