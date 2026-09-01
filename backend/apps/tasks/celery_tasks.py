from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_async_email(subject, message, recipient_list, html_message=None):
    """
    Celery background worker task for sending asynchronous transactional emails.
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@vibemart.com',
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False
        )
        return f"Email sent successfully to {recipient_list}"
    except Exception as e:
        logger.error(f"Failed to send async email to {recipient_list}: {str(e)}")
        return f"Error: {str(e)}"
