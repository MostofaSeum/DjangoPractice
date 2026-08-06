from django.shortcuts import render
import requests

def say_hello(request):
    response = requests.get("https://httpbin.org/delay/2")
    return render(request, 'hello.html', {'name': 'Mosh',})

