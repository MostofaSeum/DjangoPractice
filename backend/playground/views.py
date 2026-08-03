from django.shortcuts import render
from .task import notify_customers

def say_hello(request):
    notify_customers.delay('Hello from Celery')
    return render(request, 'hello.html', {'name': 'Mosh'})

