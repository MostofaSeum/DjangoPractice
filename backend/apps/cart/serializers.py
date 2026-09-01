from rest_framework import serializers
from apps.cart.models import Cart, CartItem
from apps.catalog.models import Product, ProductVariant
from apps.catalog.serializers import ProductVariantSerializer

class SimpleProductSerializer(serializers.ModelSerializer):
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'title', 'unit_price', 'discount_percent', 'discounted_price', 'images', 'collection']

    def get_images(self, obj):
        return [{'id': img.id, 'image': img.image.url} for img in obj.images.all()]


class CartItemSerializer(serializers.ModelSerializer):
    product = SimpleProductSerializer()
    variant = ProductVariantSerializer(read_only=True)
    total_price = serializers.SerializerMethodField()

    def get_total_price(self, cart_item: CartItem):
        if cart_item.variant:
            price = cart_item.variant.discounted_price
        else:
            price = cart_item.product.discounted_price
        return cart_item.quantity * price

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'variant', 'quantity', 'total_price']


class AddCartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError('No product with the given ID was found.')
        return value

    def validate(self, attrs):
        prod_id = attrs.get('product_id')
        var_id = attrs.get('variant_id')
        if var_id:
            if not ProductVariant.objects.filter(pk=var_id, product_id=prod_id, is_active=True).exists():
                raise serializers.ValidationError({'variant_id': 'Selected variant does not exist for this product.'})
        return attrs

    def save(self, **kwargs):
        cart_id = self.context['cart_id']
        product_id = self.validated_data['product_id']
        variant_id = self.validated_data.get('variant_id')
        quantity = self.validated_data.get('quantity', 1)

        try:
            cart_item = CartItem.objects.get(cart_id=cart_id, product_id=product_id, variant_id=variant_id)
            cart_item.quantity += quantity
            cart_item.save()
            self.instance = cart_item
        except CartItem.DoesNotExist:
            self.instance = CartItem.objects.create(
                cart_id=cart_id,
                product_id=product_id,
                variant_id=variant_id,
                quantity=quantity
            )

        return self.instance

    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'variant_id', 'quantity']


class UpdateCartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['quantity']


class CartSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    def get_total_price(self, cart):
        return sum([
            item.quantity * (item.variant.discounted_price if item.variant else item.product.discounted_price)
            for item in cart.items.all()
        ])

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price']
