from django.shortcuts import render
from django.core.mail import EmailMessage,BadHeaderError


def say_hello(request):
    try:
        message = EmailMessage('subject', 'message', 'mostofaseum8@gmail.com', ['mostofa.seum@brainicontech.com'])
        
    except BadHeaderError:
        pass
    return render(request, 'hello.html', {'name': 'Mosh'})
