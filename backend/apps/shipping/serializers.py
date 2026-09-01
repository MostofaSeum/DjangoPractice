from rest_framework import serializers
from apps.shipping.models import DeliverySetting, DeliveryRule

class DeliverySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliverySetting
        fields = [
            'id', 'inside_dhaka_charge', 'outside_dhaka_charge',
            'estimated_days_inside', 'estimated_days_outside',
            'is_active', 'last_updated'
        ]


class DeliveryRuleSerializer(serializers.ModelSerializer):
    target_type_display = serializers.CharField(source='get_target_type_display', read_only=True)
    rule_type_display = serializers.CharField(source='get_rule_type_display', read_only=True)

    class Meta:
        model = DeliveryRule
        fields = [
            'id', 'title', 'target_type', 'target_type_display',
            'rule_type', 'rule_type_display',
            'inside_dhaka_charge', 'outside_dhaka_charge',
            'products', 'collection', 'min_quantity', 'min_order_amount',
            'is_active', 'created_at'
        ]
