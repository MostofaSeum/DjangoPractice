from rest_framework import serializers 
from .models import Product,Collection,Cart,Review,CartItem,Customer,Order
from decimal import Decimal

# class ProductSerializers(serializers.Serializer):
#     id = serializers.IntegerField()   
#     title = serializers.CharField(max_length=255)
#     price = serializers.DecimalField(max_digits=6,decimal_places=2,source = 'unit_price')
#     price_with_tax = serializers.SerializerMethodField(method_name='calculate_tax')
#     collection = serializers.StringRelatedField()

class ProductSerializers(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'title', 'description', 'slug', 'inventory', 'unit_price', 'price_with_tax', 'collection']
    price_with_tax = serializers.SerializerMethodField(method_name='calculate_tax')
    def calculate_tax(self, product):
        return product.unit_price * Decimal('1.1')

class CollectionSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source = "product_set.count", read_only = True)
    class Meta:
        model = Collection
        fields = ['id', 'title','featured_product','product_count']

class CollectionDetailSerializer(serializers.ModelSerializer):
    products = ProductSerializers(many=True, read_only=True, source='product_set')
    class Meta:
        model = Collection
        fields = ['id', 'title', 'featured_product', 'products']


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'name', 'description', 'date']

    def create (self,validated_data):
        product_id = self.context['product_id']
        return Review.objects.create(**validated_data, product_id = product_id)

class SimpleProductSerializers(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'title', 'unit_price']

class CartItemSerializers(serializers.ModelSerializer):
    product = SimpleProductSerializers()
    class Meta:
        model = CartItem
        fields = ['id','product','quantity','total_price']
    total_price = serializers.SerializerMethodField()
    def get_total_price(self, cartitem):
        return cartitem.quantity * cartitem.product.unit_price

class CartSerializers(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only = True)
    items = CartItemSerializers(many=True, read_only = True)
    total_price = serializers.SerializerMethodField()

    def get_total_price(self,cart):
       return sum([item.quantity * item.product.unit_price for item in cart.items.all()])
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price']

class AddCartItemSerializers(serializers.ModelSerializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=100)


    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError('No product with this ID exists.')
        return value

    def save(self, **kwargs):
        product_id = self.validated_data['product_id']
        quantity = self.validated_data['quantity']
        cart_id = self.context['cart_id']
        try:
            cart_item = CartItem.objects.get(cart_id = cart_id, product_id = product_id)
            cart_item.quantity += quantity
            cart_item.save()
            self.instance = cart_item
        except CartItem.DoesNotExist:
            self.instance = CartItem.objects.create(cart_id = cart_id, **self.validated_data)
        return self.instance

    class Meta:
        model = CartItem
        fields = ['product_id','quantity']

class UpdateCartItemSerializers(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['quantity']

class CustomerSerializers(serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only = True)
    class Meta:
        model = Customer
        fields = ['id', 'user_id', 'phone', 'birth_date','membership']


class OrderSerializers(serializers.ModelSerializer):
    items = CartItemSerializers(many = True)
    class Meta:
        model = Order
        fields = ['id', 'customer', 'payment_status', 'items']