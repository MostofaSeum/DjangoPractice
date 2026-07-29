from django.shortcuts import render
from django.core.mail import EmailMessage,BadHeaderError
from templated_mail.mail import BaseEmailMessage

def say_hello(request):
    try:
        # message = EmailMessage('subject', 'message', 'mostofaseum8@gmail.com', ['mostofa.seum@brainicontech.com'])
        # message.attach_file('D:/Brainicon Technology/storefront/backend/playground/static/images/Sea.png')
        message = BaseEmailMessage(
            template_name='emails/hello.html',
            context={'name': 'Seum'},
        )
        message.send(['mostofa.seum@brainicontech.com'])
    except BadHeaderError:
        pass
    return render(request, 'hello.html', {'name': 'Mosh'})
