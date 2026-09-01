from rest_framework import serializers
from apps.customers.models import Customer, Address, Subscriber, WishlistItem
from apps.catalog.serializers import ProductSerializer

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'title', 'street', 'city', 'is_default', 'created_at']

    def create(self, validated_data):
        customer = self.context['customer']
        if validated_data.get('is_default', False):
            Address.objects.filter(customer=customer).update(is_default=False)
        return Address.objects.create(customer=customer, **validated_data)

    def update(self, instance, validated_data):
        if validated_data.get('is_default', False):
            Address.objects.filter(customer=instance.customer).exclude(pk=instance.pk).update(is_default=False)
        return super().update(instance, validated_data)


class CustomerSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'user_id', 'phone', 'birth_date', 'membership', 'vibe_coin', 'first_name', 'last_name', 'email', 'addresses']


class SubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscriber
        fields = ['id', 'email', 'created_at']


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        product_id = validated_data['product_id']
        wishlist_item, _ = WishlistItem.objects.get_or_create(user=user, product_id=product_id)
        return wishlist_item
