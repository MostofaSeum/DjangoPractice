from rest_framework import serializers
from apps.promotions.models import Promotion, GiftCard, Coupon

class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'description', 'discount', 'valid_until', 'created_at']


class GiftCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftCard
        fields = ['id', 'user_email', 'card_code', 'price', 'created_at', 'expiry_date', 'is_used']


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['id', 'code', 'discount_percent', 'valid_from', 'valid_to', 'target_type', 'products', 'collection', 'is_active', 'created_at']
