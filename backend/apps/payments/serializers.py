from rest_framework import serializers
from apps.payments.models import PaymentSetting

class PaymentSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentSetting
        fields = ['id', 'bkash_number', 'bkash_active', 'nagad_number', 'nagad_active', 'cod_active', 'vibecoin_active', 'last_updated']
