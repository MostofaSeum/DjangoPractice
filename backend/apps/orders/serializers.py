from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.db.models import F, Value
from django.db.models.functions import Greatest

from apps.orders.models import Order, OrderItem
from apps.customers.models import Customer
from apps.cart.models import Cart, CartItem
from apps.catalog.models import Product, ProductVariant
from apps.catalog.serializers import ProductVariantSerializer
from apps.cart.serializers import SimpleProductSerializer
from apps.shipping.models import DeliverySetting, DeliveryRule
from apps.promotions.models import Coupon

class OrderItemSerializer(serializers.ModelSerializer):
    product = SimpleProductSerializer()
    variant = ProductVariantSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'variant', 'variant_title', 'unit_price', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'placed_at', 'payment_status', 'items',
            'shipping_address', 'phone', 'payment_method', 'transaction_id',
            'transaction_phone_no', 'delivery_area', 'delivery_charge',
            'coupon_code', 'is_edited_by_admin', 'edited_at'
        ]


class AdminOrderUpdateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        model = Order
        fields = [
            'shipping_address', 'phone', 'payment_status', 'payment_method',
            'transaction_id', 'transaction_phone_no', 'delivery_area',
            'delivery_charge', 'coupon_code', 'items'
        ]

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        with transaction.atomic():
            if instance.payment_status == Order.PAYMENT_STATUS_COMPLETE:
                for old_item in instance.items.select_related('product', 'variant').all():
                    if old_item.product_id:
                        Product.objects.filter(pk=old_item.product_id).update(inventory=F('inventory') + old_item.quantity)
                    if old_item.variant_id:
                        ProductVariant.objects.filter(pk=old_item.variant_id).update(inventory=F('inventory') + old_item.quantity)

            for attr, val in validated_data.items():
                setattr(instance, attr, val)
            
            instance.is_edited_by_admin = True
            instance.edited_at = timezone.now()
            instance.save()

            if items_data is not None:
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


class CreateOrderSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField()
    shipping_address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=255, required=False, allow_blank=True)
    payment_method = serializers.CharField(max_length=1, required=False, default='C')
    transaction_id = serializers.CharField(max_length=255, required=False, allow_blank=True)
    transaction_phone_no = serializers.CharField(max_length=255, required=False, allow_blank=True)
    delivery_area = serializers.CharField(max_length=20, required=False, default='inside_dhaka')
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_cart_id(self, cart_id):
        if not Cart.objects.filter(pk=cart_id).exists():
            raise serializers.ValidationError('No cart with the given ID was found.')
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

            delivery_settings = DeliverySetting.get_settings()
            if delivery_area == Order.DELIVERY_AREA_OUTSIDE_DHAKA:
                base_delivery_charge = delivery_settings.outside_dhaka_charge
            else:
                base_delivery_charge = delivery_settings.inside_dhaka_charge
            
            cart_items = list(CartItem.objects.select_related('product', 'variant').filter(cart_id=cart_id))
            if not cart_items:
                raise serializers.ValidationError({'cart_id': 'The cart is empty.'})

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

            active_coupon = None
            if coupon_code:
                try:
                    c = Coupon.objects.prefetch_related('products').select_related('collection').get(code__iexact=coupon_code)
                    now = timezone.now()
                    if c.is_active and (not c.valid_from or now >= c.valid_from) and (not c.valid_to or now <= c.valid_to):
                        active_coupon = c
                except Coupon.DoesNotExist:
                    pass

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
                
                if prod_discount > 0:
                    effective_price = unit_price * (Decimal('1') - (prod_discount / Decimal('100')))
                else:
                    effective_price = unit_price

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

            # select_for_update() pessimistic stock locking
            for item in cart_items:
                if item.variant_id:
                    locked_variant = ProductVariant.objects.select_for_update().get(pk=item.variant_id)
                    if locked_variant.inventory < item.quantity:
                        raise serializers.ValidationError({
                            'cart_id': f'Sorry, only {locked_variant.inventory} units available for "{locked_variant.product.title} - {locked_variant.name}".'
                        })
                    locked_variant.inventory -= item.quantity
                    locked_variant.save()
                else:
                    locked_product = Product.objects.select_for_update().get(pk=item.product_id)
                    if locked_product.inventory < item.quantity:
                        raise serializers.ValidationError({
                            'cart_id': f'Sorry, only {locked_product.inventory} units available for "{locked_product.title}".'
                        })
                    locked_product.inventory -= item.quantity
                    locked_product.save()

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
            return order
