from .signals import order_created
from django.db.models import UUIDField
from django.db import transaction
from rest_framework import serializers 
from .models import Product,Collection,Cart,Review,CartItem,Customer,Order,OrderItem,ProductImage,GiftCard
from decimal import Decimal

# class ProductSerializers(serializers.Serializer):
#     id = serializers.IntegerField()   
#     title = serializers.CharField(max_length=255)
#     price = serializers.DecimalField(max_digits=6,decimal_places=2,source = 'unit_price')
#     price_with_tax = serializers.SerializerMethodField(method_name='calculate_tax')
#     collection = serializers.StringRelatedField()
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image'] 

    def create(self, validated_data):
        product_id = self.context['product_id']
        return ProductImage.objects.create(product_id=product_id, **validated_data)
        
class ProductSerializers(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    price_with_tax = serializers.SerializerMethodField(method_name='calculate_tax')

    class Meta:
        model = Product
        fields = ['id', 'title', 'description', 'slug', 'inventory', 'unit_price', 'price_with_tax', 'collection', 'images', 'is_photos_published']

    def calculate_tax(self, product):
        return product.unit_price * Decimal('1.1')

    def get_images(self, product):
        request = self.context.get('request')
        is_staff = request and hasattr(request, 'user') and request.user and request.user.is_staff
        if not product.is_photos_published and not is_staff:
            return []
        serializer = ProductImageSerializer(product.images.all(), many=True, context=self.context)
        return serializer.data

class CollectionSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Collection
        fields = ['id', 'title', 'featured_product', 'product_count', 'image']

class CollectionDetailSerializer(serializers.ModelSerializer):
    products = ProductSerializers(many=True, read_only=True, source='product_set')
    class Meta:
        model = Collection
        fields = ['id', 'title', 'featured_product', 'products', 'image']


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'name', 'description', 'date']

    def create (self,validated_data):
        product_id = self.context['product_id']
        return Review.objects.create(**validated_data, product_id = product_id)

class SimpleProductSerializers(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = ['id', 'title', 'unit_price', 'inventory', 'images', 'is_photos_published']

    def get_images(self, product):
        request = self.context.get('request')
        is_staff = request and hasattr(request, 'user') and request.user and request.user.is_staff
        if not product.is_photos_published and not is_staff:
            return []
        serializer = ProductImageSerializer(product.images.all(), many=True, context=self.context)
        return serializer.data

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
    customer = serializers.PrimaryKeyRelatedField(read_only=True)
    items = CartItemSerializers(many=True, read_only = True)
    total_price = serializers.SerializerMethodField()

    def get_total_price(self,cart):
       return sum([item.quantity * item.product.unit_price for item in cart.items.all()])
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'customer']

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
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'user_id', 'first_name', 'last_name', 'email', 'customer_name', 'phone', 'birth_date', 'membership', 'vibe_coin']
        read_only_fields = ['vibe_coin']

    def get_customer_name(self, obj):
        if hasattr(obj, 'user') and obj.user:
            return obj.user.username
        return f"Customer #{obj.id}"

class OrderItemSerializer(serializers.ModelSerializer):
    product = SimpleProductSerializers()
    class Meta:
        model = OrderItem
        fields = ['id','product', 'quantity', 'unit_price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many =True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_name', 'payment_status','placed_at', 'shipping_address', 'phone', 'payment_method', 'transaction_id', 'transaction_phone_no', 'items']

    def get_customer_name(self, obj):
        if obj.customer and hasattr(obj.customer, 'user') and obj.customer.user:
            return obj.customer.user.username
        return f"Customer #{obj.customer_id}"

class UpdateOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['payment_status']

class CreateOrderSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField()
    shipping_address = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    phone = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    payment_method = serializers.CharField(max_length=1, required=False, default='C')
    transaction_id = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    transaction_phone_no = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')

    def validate_cart_id(self, cart_id):
        if not Cart.objects.filter(pk=cart_id).exists():
            raise serializers.ValidationError('No cart with this ID exists.')
        if CartItem.objects.filter(cart_id=cart_id).count() == 0:
            raise serializers.ValidationError('This cart is empty.')
        return cart_id
        

    def save(self, **kwargs):
        with transaction.atomic():
            cart_id = self.validated_data['cart_id']
            customer = Customer.objects.get(user_id=self.context['user_id'])
            payment_method = self.validated_data.get('payment_method', 'C')
            
            cart_items = list(CartItem.objects.select_related('product').filter(cart_id=cart_id))
            if not cart_items:
                raise serializers.ValidationError({'cart_id': 'The cart is empty.'})

            payment_status = Order.PAYMENT_STATUS_PENDING
            if payment_method == 'V':
                order_total = sum(item.quantity * item.product.unit_price for item in cart_items)
                if customer.vibe_coin < order_total:
                    raise serializers.ValidationError({
                        'payment_method': f'Insufficient VibeCoin balance. Required: {order_total:.2f} VC, Available: {customer.vibe_coin:.2f} VC.'
                    })
                customer.vibe_coin -= order_total
                customer.save()

            order = Order.objects.create(
                customer=customer,
                shipping_address=self.validated_data.get('shipping_address', ''),
                phone=self.validated_data.get('phone', ''),
                payment_method=payment_method,
                payment_status=payment_status,
                transaction_id=self.validated_data.get('transaction_id', ''),
                transaction_phone_no=self.validated_data.get('transaction_phone_no', '')
            )

            order_items = [
                OrderItem(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    unit_price=item.product.unit_price
                ) for item in cart_items
            ]

            OrderItem.objects.bulk_create(order_items)
            Cart.objects.filter(pk=cart_id).delete()

            order_created.send_robust(self.__class__, order=order)
            return order


class GiftCardSerializer(serializers.ModelSerializer):
    card_code = serializers.CharField(max_length=50, read_only=True)
    phone = serializers.CharField(max_length=255, write_only=True, required=False, allow_blank=True)
    transaction_id = serializers.CharField(max_length=255, write_only=True, required=False, allow_blank=True)
    transaction_phone_no = serializers.CharField(max_length=255, write_only=True, required=False, allow_blank=True)
    payment_method = serializers.CharField(max_length=1, write_only=True, required=False, default='C')
    ALLOWED_PRICES = [500, 1000, 1500, 2000, 2500, 3000]

    class Meta:
        model = GiftCard
        fields = ['id', 'user_email', 'card_code', 'price', 'created_at', 'expiry_date', 'is_used', 'phone', 'transaction_id', 'transaction_phone_no', 'payment_method']
        read_only_fields = ['id', 'card_code', 'created_at', 'expiry_date']

    def validate_price(self, value):
        if int(value) not in self.ALLOWED_PRICES:
            raise serializers.ValidationError(
                f"Invalid gift card price. Please select one of: {', '.join(str(p) for p in self.ALLOWED_PRICES)}."
            )
        return value

    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        transaction_id = validated_data.pop('transaction_id', '')
        transaction_phone_no = validated_data.pop('transaction_phone_no', '')
        payment_method = validated_data.pop('payment_method', 'C')
        
        request = self.context.get('request')
        user = request.user if request else None

        with transaction.atomic():
            gift_card = super().create(validated_data)

            if user and user.is_authenticated:
                customer, _ = Customer.objects.get_or_create(user=user)
                order = Order.objects.create(
                    customer=customer,
                    shipping_address="Gift Card",
                    phone=phone,
                    payment_method=payment_method,
                    transaction_id=transaction_id,
                    transaction_phone_no=transaction_phone_no,
                    payment_status='P',
                )
                OrderItem.objects.create(
                    order=order,
                    product=None,
                    quantity=1,
                    unit_price=gift_card.price,
                )

            return gift_card
