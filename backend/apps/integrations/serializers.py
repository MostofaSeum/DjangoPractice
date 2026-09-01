from rest_framework import serializers
from apps.integrations.models import GoogleSheetSyncSetting

class GoogleSheetSyncSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoogleSheetSyncSetting
        fields = ['id', 'sheet_url', 'last_synced_at', 'created_at', 'updated_at']
