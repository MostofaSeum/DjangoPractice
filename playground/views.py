from django.shortcuts import render
from django.http.response import HttpResponse

# Create your views here.
def say_hello(request):
    return HttpResponse('Hello World')
