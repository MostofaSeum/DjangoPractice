from django.contrib import admin
from django.conf import settings
from django.db.models import Sum
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from uuid import uuid4
from decimal import Decimal
from .validators import validate_file_size
from django.utils import timezone
from datetime import timedelta
class Promotion(models.Model):
    description = models.CharField(max_length=255)
    discount = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.description} ({self.discount}%)"


class Collection(models.Model):
    title = models.CharField(max_length=255)
    featured_product = models.ForeignKey(
        'Product', on_delete=models.SET_NULL, null=True, related_name='+', blank=True)
    image = models.ImageField(upload_to='store/collections/images', null=True, blank=True)
    is_featured = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.title

    def delete(self, *args, **kwargs):
        if self.image:
            self.image.delete(save=False)
        super().delete(*args, **kwargs)

    class Meta:
        ordering = ['title']


class Product(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField()
    short_description = models.TextField(default='Short Description')
    description = models.TextField(null=True, blank=True)
    unit_price = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(1)])
    discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)])
    inventory = models.IntegerField(validators=[MinValueValidator(0)])
    last_update = models.DateTimeField(auto_now=True)
    collection = models.ForeignKey(Collection, on_delete=models.PROTECT)
    promotions = models.ManyToManyField(Promotion, blank=True)
    is_photos_published = models.BooleanField(default=True)
    is_trending = models.BooleanField(default=False)

    @property
    def units_sold(self):
        result = self.orderitem_set.aggregate(total=Sum('quantity'))['total']
        return int(result or 0)

    @property
    def discounted_price(self):
        if self.discount_percent and self.discount_percent > 0:
            discount_amount = (self.unit_price * Decimal(str(self.discount_percent))) / Decimal('100')
            return round(self.unit_price - discount_amount, 2)
        return self.unit_price

    def __str__(self) -> str:
        return self.title

    class Meta:
        ordering = ['title']

class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=100)
    color_name = models.CharField(max_length=50, blank=True, null=True)
    color_code = models.CharField(max_length=20, blank=True, null=True)
    size = models.CharField(max_length=50, blank=True, null=True)
    price_override = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(1)])
    inventory = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to='store/variants', blank=True, null=True)
    is_active = models.BooleanField(default=True)

    @property
    def effective_price(self):
        if self.price_override is not None:
            return self.price_override
        return self.product.unit_price

    @property
    def discounted_price(self):
        base_price = self.effective_price
        if self.product.discount_percent and self.product.discount_percent > 0:
            discount_amount = (base_price * Decimal(str(self.product.discount_percent))) / Decimal('100')
            return round(base_price - discount_amount, 2)
        return base_price

    def __str__(self):
        return f"{self.product.title} - {self.name}"

    def delete(self, *args, **kwargs):
        if self.image:
            self.image.delete(save=False)
        super().delete(*args, **kwargs)


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='store/images')

    def delete(self, *args, **kwargs):
        if self.image:
            self.image.delete(save=False)
        super().delete(*args, **kwargs)


class Customer(models.Model):
    MEMBERSHIP_BRONZE = 'B'
    MEMBERSHIP_SILVER = 'S'
    MEMBERSHIP_GOLD = 'G'

    MEMBERSHIP_CHOICES = [
        (MEMBERSHIP_BRONZE, 'Bronze'),
        (MEMBERSHIP_SILVER, 'Silver'),
        (MEMBERSHIP_GOLD, 'Gold'),
    ]
    phone = models.CharField(max_length=255)
    birth_date = models.DateField(null=True, blank=True)
    membership = models.CharField(
        max_length=1, choices=MEMBERSHIP_CHOICES, default=MEMBERSHIP_BRONZE)
    vibe_coin = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.user.first_name} {self.user.last_name}'

    @admin.display(ordering='user__first_name')
    def first_name(self):
        return self.user.first_name

    @admin.display(ordering='user__last_name')
    def last_name(self):
        return self.user.last_name


    class Meta:
        ordering = ['user__first_name', 'user__last_name']
        permissions = [
            ('view_history','Can view order history')
        ]


class Order(models.Model):
    PAYMENT_STATUS_PENDING = 'P'
    PAYMENT_STATUS_COMPLETE = 'C'
    PAYMENT_STATUS_FAILED = 'F'
    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_STATUS_PENDING, 'Pending'),
        (PAYMENT_STATUS_COMPLETE, 'Complete'),
        (PAYMENT_STATUS_FAILED, 'Failed')
    ]

    PAYMENT_METHOD_COD = 'C'
    PAYMENT_METHOD_ONLINE = 'O'
    PAYMENT_METHOD_BKASH = 'B'
    PAYMENT_METHOD_NAGAD = 'N'
    PAYMENT_METHOD_VIBECOIN = 'V'
    PAYMENT_METHOD_CHOICES = [
        (PAYMENT_METHOD_COD, 'COD'),
        (PAYMENT_METHOD_ONLINE, 'Online'),
        (PAYMENT_METHOD_BKASH, 'bKash'),
        (PAYMENT_METHOD_NAGAD, 'Nagad'),
        (PAYMENT_METHOD_VIBECOIN, 'VibeCoin'),
    ]

    DELIVERY_AREA_INSIDE_DHAKA = 'inside_dhaka'
    DELIVERY_AREA_OUTSIDE_DHAKA = 'outside_dhaka'
    DELIVERY_AREA_CHOICES = [
        (DELIVERY_AREA_INSIDE_DHAKA, 'Inside Dhaka'),
        (DELIVERY_AREA_OUTSIDE_DHAKA, 'Outside Dhaka'),
    ]

    placed_at = models.DateTimeField(auto_now_add=True)
    payment_status = models.CharField(
        max_length=1, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_STATUS_PENDING)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT)
    shipping_address = models.CharField(max_length=255, default='', blank=True)
    phone = models.CharField(max_length=255, default='', blank=True)
    payment_method = models.CharField(
        max_length=1, choices=PAYMENT_METHOD_CHOICES, default=PAYMENT_METHOD_COD)
    transaction_id = models.CharField(max_length=255, default='', blank=True)
    transaction_phone_no = models.CharField(max_length=255, default='', blank=True)
    delivery_area = models.CharField(
        max_length=20, choices=DELIVERY_AREA_CHOICES, default=DELIVERY_AREA_INSIDE_DHAKA)
    delivery_charge = models.DecimalField(
        max_digits=10, decimal_places=2, default=60.00, validators=[MinValueValidator(0)])
    class Meta:
        permissions = [
            ('cancel_order', 'Can cancel order'),
        ]


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, null=True, blank=True)
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.SET_NULL, null=True, blank=True, related_name='order_items')
    variant_title = models.CharField(max_length=255, default='', blank=True)
    quantity = models.PositiveSmallIntegerField()
    unit_price = models.DecimalField(max_digits=6, decimal_places=2)


class Address(models.Model):
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE)


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name = 'items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(
        ProductVariant, on_delete=models.CASCADE, null=True, blank=True, related_name='cart_items')
    quantity = models.PositiveSmallIntegerField()

    class Meta:
        unique_together = [['cart', 'product', 'variant']]


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    name = models.CharField(max_length=255)
    description = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(5)])
    image = models.ImageField(upload_to='store/reviews/images', null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)


class ReviewImage(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='store/reviews/images')

import random
import string

def default_gift_card_expiry():
    return timezone.now() + timedelta(days=365)

def generate_16_digit_card_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))

class GiftCard(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user_email = models.EmailField()
    card_code = models.CharField(max_length=50, unique=True, default=generate_16_digit_card_code)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    created_at = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField(default=default_gift_card_expiry)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.card_code} - ৳{self.price} ({self.user_email})"


class WishlistItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'product']


class Subscriber(models.Model):
    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} ({self.created_at})"


def default_coupon_expiry():
    return timezone.now() + timedelta(days=30)


class Coupon(models.Model):
    TARGET_PRODUCT = 'product'
    TARGET_COLLECTION = 'collection'
    TARGET_CHOICES = [
        (TARGET_PRODUCT, 'Specific Products'),
        (TARGET_COLLECTION, 'Collection'),
    ]

    code = models.CharField(max_length=20, unique=True)
    discount_percent = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    valid_from = models.DateTimeField(default=timezone.now)
    valid_to = models.DateTimeField(default=default_coupon_expiry)
    target_type = models.CharField(max_length=20, choices=TARGET_CHOICES, default=TARGET_PRODUCT)
    products = models.ManyToManyField(Product, blank=True, related_name='coupons')
    collection = models.ForeignKey(Collection, on_delete=models.SET_NULL, null=True, blank=True, related_name='coupons')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} ({self.discount_percent}%)"

    class Meta:
        ordering = ['-created_at']


class PaymentSetting(models.Model):
    bkash_number = models.CharField(max_length=20, default="01711111111")
    bkash_active = models.BooleanField(default=True)
    nagad_number = models.CharField(max_length=20, default="01711111111")
    nagad_active = models.BooleanField(default=True)
    cod_active = models.BooleanField(default=True)
    vibecoin_active = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Payment Settings (bKash, Nagad, COD, VibeCoin)"

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(id=1)
        return obj


class DeliverySetting(models.Model):
    inside_dhaka_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=60.00,
        validators=[MinValueValidator(0)]
    )
    outside_dhaka_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=130.00,
        validators=[MinValueValidator(0)]
    )
    estimated_days_inside = models.CharField(max_length=50, default="1-2 Days", blank=True)
    estimated_days_outside = models.CharField(max_length=50, default="3-5 Days", blank=True)
    is_active = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Delivery Settings (Inside: ৳{self.inside_dhaka_charge}, Outside: ৳{self.outside_dhaka_charge})"

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(id=1)
        return obj

