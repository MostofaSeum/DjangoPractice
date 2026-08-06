from django.core.cache import cache
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.views import APIView
import requests
import logging


logger = logging.getLogger(__name__)

class HelloView(APIView):
    
    @method_decorator(cache_page(60 * 15))
    def get(self, request):
        try:
            logger.info('Calling httpbin...')
            response = requests.get("https://httpbin.org/delay/2")
            logger.info('Received response from httpbin')
            data = response.json()
        except requests.ConnectionError:
            logger.error('httpbin is offline')
        return render(request, 'hello.html', {'name': 'Seum'})

    
