from django.shortcuts import render
from django.core.mail import send_mail,mail_admins,BadHeaderError


def say_hello(request):
    try:
        send_mail('subject', 'message', 'mostofaseum8@gmail.com', ['mostofa.seum@brainicontech.com'])
    except BadHeaderError:
        pass
    return render(request, 'hello.html', {'name': 'Mosh'})
