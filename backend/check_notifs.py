import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storefront.settings')
django.setup()
from store.models import Notification

print("TOTAL_COUNT:", Notification.objects.count())
print("UNREAD_COUNT:", Notification.objects.filter(is_read=False).count())
for n in Notification.objects.all()[:15]:
    print(f"ID={n.id} | TYPE={n.notification_type} | READ={n.is_read} | TITLE={n.title}")
