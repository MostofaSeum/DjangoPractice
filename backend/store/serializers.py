from django.db import transaction
from django.db.models import F, Value
from django.db.models.functions import Greatest
from django.utils import timezone
from .signals import order_created
from rest_framework import serializers
from .models import Product,Collection,Cart,Review,ReviewImage,CartItem,Customer,Order,OrderItem,ProductImage,ProductVariant,GiftCard,WishlistItem,Subscriber,Promotion,Coupon,PaymentSetting,DeliverySetting,DeliveryRule,Notification,Address
from decimal import Decimal

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'title', 'street', 'city', 'is_default', 'created_at']

    def validate(self, attrs):
        customer = self.context.get('customer')
        # Check limit of 5 addresses per customer on creation
        if not self.instance and customer:
            if customer.addresses.count() >= 5:
                raise serializers.ValidationError("You can only save up to 5 addresses.")
        return attrs

    def create(self, validated_data):
        customer = self.context['customer']
        is_default = validated_data.get('is_default', False)
        
        # If this is the user's first address, force is_default to True
        if not customer.addresses.exists():
            is_default = True
            validated_data['is_default'] = True
            
        if is_default:
            customer.addresses.filter(is_default=True).update(is_default=False)
            
        return Address.objects.create(customer=customer, **validated_data)

    def update(self, instance, validated_data):
        is_default = validated_data.get('is_default', instance.is_default)
        customer = instance.customer
        
        if is_default:
            customer.addresses.exclude(pk=instance.pk).filter(is_default=True).update(is_default=False)
            
        return super().update(instance, validated_data)

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image'] 

    def create(self, validated_data):
        product_id = self.context['product_id']
        return ProductImage.objects.create(product_id=product_id, **validated_data)

class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    discounted_price = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product', 'name', 'color_name', 'color_code', 'size',
            'price_override', 'effective_price', 'discounted_price',
            'inventory', 'image', 'is_active'
        ]
        read_only_fields = ['product']

    def create(self, validated_data):
        product_id = self.context.get('product_id')
        if not product_id and 'view' in self.context and hasattr(self.context['view'], 'kwargs'):
            product_id = self.context['view'].kwargs.get('product_pk')
        if product_id:
            validated_data['product_id'] = product_id
        return super().create(validated_data)

class ProductSerializers(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    variants = ProductVariantSerializer(many=True, read_only=True)
    price_with_tax = serializers.SerializerMethodField(method_name='calculate_tax')
    discounted_price = serializers.SerializerMethodField()
    units_sold = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    total_inventory = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'title', 'short_description', 'description', 'slug', 'inventory', 'total_inventory', 'unit_price', 'discount_percent', 'discount_valid_until', 'is_discount_active', 'discounted_price', 'price_with_tax', 'collection', 'images', 'variants', 'is_photos_published', 'is_trending', 'is_visible', 'units_sold', 'average_rating', 'review_count']

    def validate_short_description(self, value):
        if value:
            word_count = len(value.strip().split())
            if word_count > 150:
                raise serializers.ValidationError(f'Short description cannot exceed 150 words (currently {word_count} words).')
        return value

    def validate_description(self, value):
        if value:
            word_count = len(value.strip().split())
            if word_count > 500:
                raise serializers.ValidationError(f'Details description cannot exceed 500 words (currently {word_count} words).')
        return value

    def calculate_tax(self, product):
        return product.discounted_price * Decimal('1.1')

    def get_discounted_price(self, product):
        return float(product.discounted_price)

    def get_images(self, product):
        request = self.context.get('request')
        is_staff = request and hasattr(request, 'user') and request.user and request.user.is_staff
        if not product.is_photos_published and not is_staff:
            return []
        serializer = ProductImageSerializer(product.images.all(), many=True, context=self.context)
        return serializer.data

class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = ['id', 'description', 'discount', 'valid_until', 'created_at']

class CollectionSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Collection
        fields = ['id', 'title', 'featured_product', 'product_count', 'image', 'is_featured', 'is_visible']

class CollectionDetailSerializer(serializers.ModelSerializer):
    products = ProductSerializers(many=True, read_only=True, source='product_set')
    class Meta:
        model = Collection
        fields = ['id', 'title', 'featured_product', 'products', 'image', 'is_visible']


class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['id', 'image']


class ReviewSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user_id', 'product', 'product_title', 'name', 'rating', 'description', 'image', 'images', 'date']
        read_only_fields = ['product']

    def create (self,validated_data):
        product_id = self.context['product_id']
        request = self.context.get('request')
        user = request.user if (request and hasattr(request, 'user') and request.user and request.user.is_authenticated) else None
        review = Review.objects.create(**validated_data, product_id = product_id, user = user)
        if request and request.FILES:
            uploaded_images = request.FILES.getlist('images') or request.FILES.getlist('image')
            for img in uploaded_images[:5]:
                ReviewImage.objects.create(review=review, image=img)
        return review

    def update(self, instance, validated_data):
        instance.description = validated_data.get('description', instance.description)
        instance.rating = validated_data.get('rating', instance.rating)
        instance.save()

        request = self.context.get('request')
        if request:
            deleted_ids = request.data.getlist('deleted_image_ids') if hasattr(request.data, 'getlist') else request.data.get('deleted_image_ids', [])
            if deleted_ids:
                if isinstance(deleted_ids, str):
                    deleted_ids = [int(i.strip()) for i in deleted_ids.split(',') if i.strip().isdigit()]
                ReviewImage.objects.filter(review=instance, id__in=deleted_ids).delete()

            if request.FILES:
                new_images = request.FILES.getlist('images') or request.FILES.getlist('image')
                existing_count = instance.images.count()
                allowed_slots = max(0, 5 - existing_count)
                for img in new_images[:allowed_slots]:
                    ReviewImage.objects.create(review=instance, image=img)

        return instance

class SimpleProductSerializers(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    total_inventory = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'title', 'unit_price', 'discount_percent', 'discount_valid_until', 'is_discount_active', 'discounted_price', 'inventory', 'total_inventory', 'images', 'is_photos_published', 'collection']

    def get_discounted_price(self, product):
        return float(product.discounted_price)

    def get_images(self, product):
        request = self.context.get('request')
        is_staff = request and hasattr(request, 'user') and request.user and request.user.is_staff
        if not product.is_photos_published and not is_staff:
            return []
        serializer = ProductImageSerializer(product.images.all(), many=True, context=self.context)
        return serializer.data

class SimpleProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    discounted_price = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'color_name', 'color_code', 'size',
            'price_override', 'effective_price', 'discounted_price',
            'inventory', 'image', 'is_active'
        ]

class CartItemSerializers(serializers.ModelSerializer):
    product = SimpleProductSerializers()
    variant = SimpleProductVariantSerializer(read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'variant', 'quantity', 'total_price']

    def get_total_price(self, cartitem):
        if cartitem.variant:
            unit_val = cartitem.variant.discounted_price
        else:
            unit_val = cartitem.product.discounted_price
        return float(cartitem.quantity * unit_val)

class CartSerializers(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    customer = serializers.PrimaryKeyRelatedField(read_only=True)
    items = CartItemSerializers(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    def get_total_price(self, cart):
        total = Decimal('0.00')
        for item in cart.items.all():
            if item.variant:
                unit_val = Decimal(str(item.variant.discounted_price))
            else:
                unit_val = Decimal(str(item.product.discounted_price))
            total += Decimal(item.quantity) * unit_val
        return float(total)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'customer']

class AddCartItemSerializers(serializers.ModelSerializer):
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    quantity = serializers.IntegerField(min_value=1, max_value=100)

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError('No product with this ID exists.')
        return value

    def validate(self, attrs):
        product_id = attrs.get('product_id')
        variant_id = attrs.get('variant_id')
        if variant_id:
            if not ProductVariant.objects.filter(pk=variant_id, product_id=product_id).exists():
                raise serializers.ValidationError({'variant_id': 'Selected variant does not belong to this product or does not exist.'})
        return attrs

    def save(self, **kwargs):
        product_id = self.validated_data['product_id']
        variant_id = self.validated_data.get('variant_id')
        quantity = self.validated_data['quantity']
        cart_id = self.context['cart_id']

        # If no variant was explicitly selected, but product has variants, pick the first active variant
        if variant_id is None:
            active_variant = ProductVariant.objects.filter(product_id=product_id, is_active=True).first()
            if active_variant:
                variant_id = active_variant.id

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
        fields = ['product_id', 'variant_id', 'quantity']

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
    variant = SimpleProductVariantSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'variant', 'variant_title', 'quantity', 'unit_price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_name', 'payment_status', 'placed_at', 'shipping_address', 'phone', 'payment_method', 'transaction_id', 'transaction_phone_no', 'delivery_area', 'delivery_charge', 'coupon_code', 'is_edited_by_admin', 'edited_at', 'items']

    def get_customer_name(self, obj):
        if obj.customer and hasattr(obj.customer, 'user') and obj.customer.user:
            return obj.customer.user.username
        return f"Customer #{obj.customer_id}"

class AdminEditOrderItemSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False, allow_null=True)
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

class AdminEditOrderSerializer(serializers.ModelSerializer):
    items = AdminEditOrderItemSerializer(many=True, required=True)

    class Meta:
        model = Order
        fields = ['payment_status', 'shipping_address', 'phone', 'delivery_area', 'delivery_charge', 'items']

    def validate(self, attrs):
        instance = self.instance
        if instance and instance.payment_method != Order.PAYMENT_METHOD_COD:
            raise serializers.ValidationError({"error": "Only Cash on Delivery (COD) orders can be edited by admin."})
        items_data = attrs.get('items', [])
        if not items_data:
            raise serializers.ValidationError({"items": "An order must contain at least one item."})
        return attrs

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        with transaction.atomic():
            # If the order was already complete, restore previous stock before applying modifications
            if instance.payment_status == Order.PAYMENT_STATUS_COMPLETE:
                for old_item in instance.items.select_related('product', 'variant').all():
                    if old_item.product_id:
                        Product.objects.filter(pk=old_item.product_id).update(inventory=F('inventory') + old_item.quantity)
                    if old_item.variant_id:
                        ProductVariant.objects.filter(pk=old_item.variant_id).update(inventory=F('inventory') + old_item.quantity)

            # Update Order fields
            for attr, val in validated_data.items():
                setattr(instance, attr, val)
            
            instance.is_edited_by_admin = True
            instance.edited_at = timezone.now()
            instance.save()

            if items_data is not None:
                # Remove previous items and recreate/re-assign
                instance.items.all().delete()
                
                new_items = []
                for item_dict in items_data:
                    prod_id = item_dict.get('product_id')
                    var_id = item_dict.get('variant_id')
                    qty = item_dict.get('quantity', 1)
                    
                    product_obj = Product.objects.filter(pk=prod_id).first()
                    if not product_obj:
                        continue
                    
                    variant_obj = None
                    variant_title = ''
                    if var_id:
                        variant_obj = ProductVariant.objects.filter(pk=var_id, product_id=prod_id).first()
                        if variant_obj:
                            variant_title = variant_obj.name

                    # Determine unit price
                    if 'unit_price' in item_dict and item_dict['unit_price'] is not None:
                        unit_price = Decimal(str(item_dict['unit_price']))
                    elif variant_obj:
                        unit_price = variant_obj.discounted_price
                    else:
                        unit_price = product_obj.discounted_price

                    order_item = OrderItem(
                        order=instance,
                        product=product_obj,
                        variant=variant_obj,
                        variant_title=variant_title,
                        quantity=qty,
                        unit_price=unit_price
                    )
                    new_items.append(order_item)

                OrderItem.objects.bulk_create(new_items)

            # If the order is currently Complete, deduct new stock
            if instance.payment_status == Order.PAYMENT_STATUS_COMPLETE:
                for new_item in instance.items.select_related('product', 'variant').all():
                    if new_item.product_id:
                        Product.objects.filter(pk=new_item.product_id).update(
                            inventory=Greatest(F('inventory') - new_item.quantity, Value(0))
                        )
                    if new_item.variant_id:
                        ProductVariant.objects.filter(pk=new_item.variant_id).update(
                            inventory=Greatest(F('inventory') - new_item.quantity, Value(0))
                        )

        return instance

class UpdateOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['payment_status']

    def update(self, instance, validated_data):
        new_status = validated_data.get('payment_status')
        old_status = instance.payment_status

        with transaction.atomic():
            instance.payment_status = new_status
            instance.save()

            # When order is transitioned to COMPLETE from another status (e.g. PENDING or FAILED)
            if new_status == Order.PAYMENT_STATUS_COMPLETE and old_status != Order.PAYMENT_STATUS_COMPLETE:
                for item in instance.items.select_related('product', 'variant').all():
                    qty = item.quantity

                    # Reduce product inventory safely (never below 0)
                    if item.product_id:
                        Product.objects.filter(pk=item.product_id).update(
                            inventory=Greatest(F('inventory') - qty, Value(0))
                        )

                    # Also reduce variant inventory if a variant was selected
                    if item.variant_id:
                        ProductVariant.objects.filter(pk=item.variant_id).update(
                            inventory=Greatest(F('inventory') - qty, Value(0))
                        )

            # If order was previously COMPLETE and is reverted back to PENDING/FAILED, restore inventory
            elif old_status == Order.PAYMENT_STATUS_COMPLETE and new_status != Order.PAYMENT_STATUS_COMPLETE:
                for item in instance.items.select_related('product', 'variant').all():
                    qty = item.quantity

                    if item.product_id:
                        Product.objects.filter(pk=item.product_id).update(
                            inventory=F('inventory') + qty
                        )

                    if item.variant_id:
                        ProductVariant.objects.filter(pk=item.variant_id).update(
                            inventory=F('inventory') + qty
                        )

        return instance

class CreateOrderSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField()
    shipping_address = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    phone = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    payment_method = serializers.CharField(max_length=1, required=False, default='C')
    transaction_id = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    transaction_phone_no = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    delivery_area = serializers.CharField(max_length=20, required=False, default='inside_dhaka')

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
            raw_coupon_code = self.validated_data.get('coupon_code', '')
            coupon_code = str(raw_coupon_code).strip().upper() if raw_coupon_code else ''
            delivery_area = self.validated_data.get('delivery_area', 'inside_dhaka')
            if delivery_area not in [Order.DELIVERY_AREA_INSIDE_DHAKA, Order.DELIVERY_AREA_OUTSIDE_DHAKA]:
                delivery_area = Order.DELIVERY_AREA_INSIDE_DHAKA

            # Fetch active delivery settings
            delivery_settings = DeliverySetting.get_settings()
            if delivery_area == Order.DELIVERY_AREA_OUTSIDE_DHAKA:
                base_delivery_charge = delivery_settings.outside_dhaka_charge
            else:
                base_delivery_charge = delivery_settings.inside_dhaka_charge
            
            cart_items = list(CartItem.objects.select_related('product', 'variant').filter(cart_id=cart_id))
            if not cart_items:
                raise serializers.ValidationError({'cart_id': 'The cart is empty.'})

            # Check for applicable DeliveryRule (Free or Reduced Delivery)
            # Find the best (lowest) delivery fee for the customer across all qualifying cart items
            delivery_charge = Decimal(str(base_delivery_charge))
            active_delivery_rules = list(DeliveryRule.objects.filter(is_active=True).prefetch_related('products'))
            if active_delivery_rules:
                for item in cart_items:
                    for rule in active_delivery_rules:
                        is_rule_match = False
                        if rule.target_type == DeliveryRule.TARGET_PRODUCT:
                            is_rule_match = rule.products.filter(pk=item.product_id).exists()
                        elif rule.target_type == DeliveryRule.TARGET_COLLECTION:
                            is_rule_match = (item.product.collection_id == rule.collection_id)

                        if is_rule_match:
                            if rule.rule_type == DeliveryRule.RULE_FREE:
                                rule_charge = Decimal('0.00')
                            else:
                                if delivery_area == Order.DELIVERY_AREA_OUTSIDE_DHAKA:
                                    rule_charge = Decimal(str(rule.outside_dhaka_charge))
                                else:
                                    rule_charge = Decimal(str(rule.inside_dhaka_charge))

                            if rule_charge < delivery_charge:
                                delivery_charge = rule_charge

            # Check for valid coupon
            active_coupon = None
            if coupon_code:
                try:
                    c = Coupon.objects.prefetch_related('products').select_related('collection').get(code__iexact=coupon_code)
                    now = timezone.now()
                    if c.is_active and (not c.valid_from or now >= c.valid_from) and (not c.valid_to or now <= c.valid_to):
                        active_coupon = c
                except Coupon.DoesNotExist:
                    pass

            # Calculate effective price per item considering variant price, product discount, and coupon discount
            order_items_data = []
            for item in cart_items:
                prod = item.product
                variant = item.variant

                if variant:
                    unit_price = variant.effective_price
                    variant_title = variant.name
                else:
                    unit_price = prod.unit_price
                    variant_title = ''

                prod_discount = Decimal(str(prod.discount_percent or 0))
                
                # Base price after product-level promotion
                if prod_discount > 0:
                    effective_price = unit_price * (Decimal('1') - (prod_discount / Decimal('100')))
                else:
                    effective_price = unit_price

                # Additional coupon discount if eligible
                if active_coupon:
                    is_eligible = False
                    if active_coupon.target_type == 'product':
                        is_eligible = active_coupon.products.filter(pk=prod.pk).exists()
                    elif active_coupon.target_type == 'collection':
                        is_eligible = (prod.collection_id == active_coupon.collection_id)
                    
                    if is_eligible:
                        coupon_disc = Decimal(str(active_coupon.discount_percent or 0))
                        if coupon_disc > 0:
                            effective_price = effective_price * (Decimal('1') - (coupon_disc / Decimal('100')))

                # Round to 2 decimals
                effective_price = round(effective_price, 2)
                order_items_data.append({
                    'product': prod,
                    'variant': variant,
                    'variant_title': variant_title,
                    'quantity': item.quantity,
                    'unit_price': effective_price
                })

            payment_status = Order.PAYMENT_STATUS_PENDING
            items_total = sum(d['quantity'] * d['unit_price'] for d in order_items_data)
            order_total = items_total + Decimal(str(delivery_charge))

            if payment_method == 'V':
                if customer.vibe_coin < order_total:
                    raise serializers.ValidationError({
                        'payment_method': f'Insufficient VibeCoin balance. Required: {order_total:.2f} VC (including ৳{delivery_charge:.2f} delivery), Available: {customer.vibe_coin:.2f} VC.'
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
                transaction_phone_no=self.validated_data.get('transaction_phone_no', ''),
                delivery_area=delivery_area,
                delivery_charge=delivery_charge,
                coupon_code=coupon_code
            )

            order_items = [
                OrderItem(
                    order=order,
                    product=d['product'],
                    variant=d['variant'],
                    variant_title=d['variant_title'],
                    quantity=d['quantity'],
                    unit_price=d['unit_price']
                ) for d in order_items_data
            ]

            OrderItem.objects.bulk_create(order_items)
            Cart.objects.filter(pk=cart_id).delete()

            # Create an admin notification for the new order
            try:
                Notification.objects.create(
                    title=f"New Order #{order.id}",
                    message=f"Customer {order.phone or customer.phone} placed an order for ৳{order_total:.2f} ({order.get_payment_method_display()}).",
                    notification_type=Notification.TYPE_ORDER,
                    target_id=str(order.id),
                    is_read=False
                )
            except Exception as notif_err:
                print(f"Failed to create notification: {notif_err}")

            order_created.send_robust(self.__class__, order=order)

            # If the customer has no saved addresses yet and provided a shipping address, save it as default
            try:
                shipping_addr_str = self.validated_data.get('shipping_address', '').strip()
                if shipping_addr_str and not customer.addresses.exists():
                    city_val = "Inside Dhaka" if delivery_area == 'inside_dhaka' else "Outside Dhaka"
                    Address.objects.create(
                        customer=customer,
                        title="Home",
                        street=shipping_addr_str,
                        city=city_val,
                        is_default=True
                    )
            except Exception as addr_err:
                print(f"Failed to auto-save customer address from order: {addr_err}")

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


class WishlistItemSerializer(serializers.ModelSerializer):
    product = SimpleProductSerializers(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        product_id = validated_data['product_id']
        wishlist_item, _ = WishlistItem.objects.get_or_create(user=user, product_id=product_id)
        return wishlist_item


class SubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscriber
        fields = ['id', 'email', 'created_at']
        read_only_fields = ['id', 'created_at']


class CouponSerializer(serializers.ModelSerializer):
    product_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, default=[]
    )
    product_count = serializers.SerializerMethodField()
    collection_title = serializers.SerializerMethodField()
    products_details = serializers.SerializerMethodField()

    def validate_code(self, value):
        cleaned_code = value.strip().upper()
        if len(cleaned_code) > 20:
            raise serializers.ValidationError("Coupon code cannot exceed 20 characters.")
        if len(cleaned_code) == 0:
            raise serializers.ValidationError("Coupon code cannot be empty.")
        return cleaned_code

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'discount_percent', 'valid_from', 'valid_to',
            'target_type', 'collection', 'collection_title', 'product_ids',
            'product_count', 'products_details', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_product_count(self, obj):
        if obj.target_type == 'product':
            return obj.products.count()
        return 0

    def get_collection_title(self, obj):
        if obj.collection:
            return obj.collection.title
        return None

    def get_products_details(self, obj):
        if obj.target_type == 'product':
            return list(obj.products.values('id', 'title', 'unit_price'))
        return []

    def create(self, validated_data):
        product_ids = validated_data.pop('product_ids', [])
        if 'code' in validated_data:
            validated_data['code'] = validated_data['code'].strip().upper()

        coupon = Coupon.objects.create(**validated_data)
        if coupon.target_type == 'product' and product_ids:
            coupon.products.set(product_ids)
        return coupon

    def update(self, instance, validated_data):
        product_ids = validated_data.pop('product_ids', None)
        if 'code' in validated_data:
            validated_data['code'] = validated_data['code'].strip().upper()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if instance.target_type == 'product' and product_ids is not None:
            instance.products.set(product_ids)
        elif instance.target_type == 'collection':
            instance.products.clear()
        return instance


class PaymentSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentSetting
        fields = [
            'id', 'bkash_number', 'bkash_active',
            'nagad_number', 'nagad_active',
            'cod_active', 'vibecoin_active',
            'last_updated'
        ]


class DeliverySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliverySetting
        fields = [
            'id', 'inside_dhaka_charge', 'outside_dhaka_charge',
            'estimated_days_inside', 'estimated_days_outside',
            'is_active', 'last_updated'
        ]


class DeliveryRuleSerializer(serializers.ModelSerializer):
    collection_title = serializers.SerializerMethodField(read_only=True)
    product_count = serializers.SerializerMethodField(read_only=True)
    products_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DeliveryRule
        fields = [
            'id', 'title', 'target_type', 'rule_type',
            'inside_dhaka_charge', 'outside_dhaka_charge',
            'products', 'collection', 'collection_title',
            'product_count', 'products_details', 'min_quantity',
            'min_order_amount', 'is_active', 'created_at'
        ]

    def get_collection_title(self, rule):
        return rule.collection.title if rule.collection else None

    def get_product_count(self, rule):
        if rule.target_type == DeliveryRule.TARGET_PRODUCT:
            return rule.products.count()
        elif rule.target_type == DeliveryRule.TARGET_COLLECTION and rule.collection:
            return rule.collection.product_set.count()
        return 0

    def get_products_details(self, rule):
        if rule.target_type == DeliveryRule.TARGET_PRODUCT:
            return list(rule.products.values('id', 'title', 'unit_price'))
        return []


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'target_id', 'is_read', 'created_at']



