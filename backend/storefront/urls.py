"""storefront URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from  django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
import debug_toolbar
from django.views.static import serve
from django.urls import re_path
from core.views import send_otp, verify_otp, reset_password


admin.site.site_header = 'Storefront Admin'
admin.site.index_title = 'Admin'



urlpatterns = [
    path('', include("core.url")),
    path('admin/', admin.site.urls),
    path('playground/', include('playground.urls')),
    path('store/', include('store.urls')),
    path('auth/otp/send/', send_otp, name='send_otp'),
    path('auth/otp/verify/', verify_otp, name='verify_otp'),
    path('auth/reset-password/', reset_password, name='reset_password'),
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
]

if settings.DEBUG:
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        try:
            import debug_toolbar
            urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
        except ImportError:
            pass

    if 'silk' in settings.INSTALLED_APPS:
        try:
            import silk
            urlpatterns += [path('silk/', include('silk.urls', namespace='silk'))]
        except ImportError:
            pass



urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
