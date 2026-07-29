from django.shortcuts import render
from django.core.mail import send_mail,BadHeaderError


def say_hello(request):
    try:
        send_mail('subject', 'message', 'mostofaseum8@gmail.com', ['mostofa.seum@brainicontech.com'])
        print("EMAIL SENT SUCCESSFULLY!")
    except Exception as e:
        print(f"EMAIL ERROR: {e}")
    return render(request, 'hello.html', {'name': 'Mosh'})
