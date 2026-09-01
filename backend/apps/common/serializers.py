from rest_framework import serializers
from .models import Notification, AuditLog

class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'notification_type_display', 'target_id', 'is_read', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    performed_by_email = serializers.EmailField(source='performed_by.email', read_only=True, default='')

    class Meta:
        model = AuditLog
        fields = ['id', 'entity_name', 'entity_id', 'action', 'performed_by', 'performed_by_name', 'performed_by_email', 'changes', 'ip_address', 'created_at']
