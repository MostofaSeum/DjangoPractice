from django.contrib import admin
from django.conf import settings
from django.db.models import Sum, Avg
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from uuid import uuid4
from decimal import Decimal
from .validators import validate_file_size
from django.utils import timezone
from datetime import timedelta
import random
import string

class Promotion(models.Model):
    description = models.CharField(max_length=255)
    discount = models.FloatField()
    valid_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.description} ({self.discount}%)"


class Collection(models.Model):
    title = models.CharField(max_length=255)
    featured_product = models.ForeignKey(
        'Product', on_delete=models.SET_NULL, null=True, related_name='+', blank=True)
    image = models.ImageField(upload_to='store/collections/images', null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    is_visible = models.BooleanField(default=True)

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
    discount_valid_until = models.DateTimeField(null=True, blank=True)
    inventory = models.IntegerField(validators=[MinValueValidator(0)])
    last_update = models.DateTimeField(auto_now=True)
    collection = models.ForeignKey(Collection, on_delete=models.PROTECT)
    promotions = models.ManyToManyField(Promotion, blank=True)
    is_photos_published = models.BooleanField(default=True)
    is_trending = models.BooleanField(default=False)
    is_visible = models.BooleanField(default=True)

    @property
    def is_discount_active(self):
        if not self.discount_percent or self.discount_percent <= 0:
            return False
        if self.discount_valid_until and timezone.now() > self.discount_valid_until:
            return False
        return True

    @property
    def units_sold(self):
        result = self.orderitem_set.aggregate(total=Sum('quantity'))['total']
        return int(result or 0)

    @property
    def average_rating(self):
        result = self.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(float(result), 1) if result is not None else 0.0

    @property
    def review_count(self):
        return self.reviews.count()

    @property
    def discounted_price(self):
        if self.is_discount_active:
            discount_amount = (self.unit_price * Decimal(str(self.discount_percent))) / Decimal('100')
            return round(self.unit_price - discount_amount, 2)
        return self.unit_price

    @property
    def total_inventory(self):
        variant_stock = self.variants.filter(is_active=True).aggregate(total=Sum('inventory'))['total']
        if variant_stock is not None and self.variants.exists():
            return int(variant_stock)
        return int(self.inventory or 0)

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
        if self.product.is_discount_active:
            discount_amount = (base_price * Decimal(str(self.product.discount_percent))) / Decimal('100')
            return round(base_price - discount_amount, 2)
        return base_price

    def __str__(self):
        return f"{self.product.title} - {self.name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        total_var_stock = self.product.variants.filter(is_active=True).aggregate(total=Sum('inventory'))['total']
        if total_var_stock is not None:
            Product.objects.filter(pk=self.product_id).update(inventory=total_var_stock)

    def delete(self, *args, **kwargs):
        if self.image:
            self.image.delete(save=False)
        product_id = self.product_id
        super().delete(*args, **kwargs)
        total_var_stock = ProductVariant.objects.filter(product_id=product_id, is_active=True).aggregate(total=Sum('inventory'))['total']
        if total_var_stock is not None:
            Product.objects.filter(pk=product_id).update(inventory=total_var_stock)


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
            ('view_history', 'Can view order history')
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

    TRACKING_PENDING = 'pending'
    TRACKING_PACKED = 'packed'
    TRACKING_IN_TRANSIT = 'in_transit'
    TRACKING_OUT_FOR_DELIVERY = 'out_for_delivery'
    TRACKING_DELIVERED = 'delivered'
    TRACKING_RETURNED = 'returned'
    TRACKING_STATUS_CHOICES = [
        (TRACKING_PENDING, 'Pending Dispatch'),
        (TRACKING_PACKED, 'Packed / Ready'),
        (TRACKING_IN_TRANSIT, 'Dispatched / In Transit'),
        (TRACKING_OUT_FOR_DELIVERY, 'Out for Delivery'),
        (TRACKING_DELIVERED, 'Delivered'),
        (TRACKING_RETURNED, 'Returned / Failed'),
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
    coupon_code = models.CharField(max_length=50, default='', blank=True)
    is_edited_by_admin = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    # Courier Logistics & Tracking Fields
    courier_partner = models.ForeignKey(
        'CourierProvider',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )
    tracking_code = models.CharField(max_length=100, default='', blank=True)
    tracking_status = models.CharField(
        max_length=30,
        choices=TRACKING_STATUS_CHOICES,
        default=TRACKING_PENDING
    )
    courier_consignment_id = models.CharField(max_length=100, default='', blank=True)
    courier_response = models.JSONField(null=True, blank=True)


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
    title = models.CharField(max_length=100, default='Home', blank=True)
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=255, default='', blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='addresses')

    class Meta:
        ordering = ['-is_default', '-created_at']


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
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


class DeliveryRule(models.Model):
    TARGET_PRODUCT = 'product'
    TARGET_COLLECTION = 'collection'
    TARGET_ORDER_TOTAL = 'order_total'
    TARGET_CHOICES = [
        (TARGET_PRODUCT, 'Specific Products'),
        (TARGET_COLLECTION, 'Collection'),
        (TARGET_ORDER_TOTAL, 'Order Total / Cart Amount Threshold'),
    ]

    RULE_FREE = 'free'
    RULE_REDUCED = 'reduced'
    RULE_CHOICES = [
        (RULE_FREE, 'Free Delivery (৳0)'),
        (RULE_REDUCED, 'Reduced Delivery Charge'),
    ]

    title = models.CharField(max_length=255)
    target_type = models.CharField(max_length=20, choices=TARGET_CHOICES, default=TARGET_PRODUCT)
    rule_type = models.CharField(max_length=20, choices=RULE_CHOICES, default=RULE_FREE)
    inside_dhaka_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    outside_dhaka_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    products = models.ManyToManyField(Product, blank=True, related_name='delivery_rules')
    collection = models.ForeignKey(Collection, on_delete=models.SET_NULL, null=True, blank=True, related_name='delivery_rules')
    min_quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    min_order_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.get_rule_type_display()})"

    class Meta:
        ordering = ['-created_at']


class GoogleSheetSyncSetting(models.Model):
    sheet_url = models.URLField(max_length=500, blank=True, default='')
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Google Sheet Sync Settings ({self.sheet_url or 'None'})"

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj


class Notification(models.Model):
    TYPE_ORDER = 'order'
    TYPE_RETURN = 'return'
    TYPE_STOCK = 'stock'
    TYPE_SYSTEM = 'system'
    TYPE_PROMOTION = 'promotion'
    TYPE_COUPON = 'coupon'
    TYPE_CHOICES = [
        (TYPE_ORDER, 'New Order'),
        (TYPE_RETURN, 'Return Request'),
        (TYPE_STOCK, 'Low Stock Alert'),
        (TYPE_SYSTEM, 'System Alert'),
        (TYPE_PROMOTION, 'Promotion Expiry Alert'),
        (TYPE_COUPON, 'Coupon Expiry Alert'),
    ]

    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_ORDER)
    target_id = models.CharField(max_length=100, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.get_notification_type_display()}] {self.title} ({'Read' if self.is_read else 'Unread'})"

    class Meta:
        ordering = ['-created_at']


class AuditLog(models.Model):
    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'
    ACTION_DELETE = 'delete'
    ACTION_CHOICES = [
        (ACTION_CREATE, 'Create'),
        (ACTION_UPDATE, 'Update'),
        (ACTION_DELETE, 'Delete'),
    ]

    entity_name = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    performed_by_name = models.CharField(max_length=255, blank=True, default='')
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.action.upper()}] {self.entity_name} #{self.entity_id} by {self.performed_by_name or 'System'} at {self.created_at}"

    class Meta:
        ordering = ['-created_at']


class SiteSetting(models.Model):
    site_title = models.CharField(max_length=255, default='VibeMart')
    tagline = models.CharField(max_length=255, default='MAKE-UP STYLE', blank=True)
    brand_description = models.TextField(
        default='VibeMart is a recognized multi-category fashion and lifestyle store built on the principle of "best price at the highest quality". Our collections are curated with premium materials that are durable, stylish, and perfect for your vibe.',
        blank=True
    )
    logo = models.ImageField(upload_to='store/settings/logos', null=True, blank=True)
    support_phone = models.CharField(max_length=50, default='+880 1700-000000', blank=True)
    support_email = models.EmailField(default='support@vibemart.com', blank=True)
    store_address = models.CharField(
        max_length=500,
        default='Homestead Gulshan Link Tower, 99 Gulshan Badda Link Rd, Dhaka 1212',
        blank=True
    )
    working_hours = models.CharField(max_length=100, default='Sat - Thu: 10:00 - 18:00', blank=True)
    facebook_url = models.URLField(max_length=500, default='https://facebook.com', blank=True)
    instagram_url = models.URLField(max_length=500, default='https://instagram.com', blank=True)
    youtube_url = models.URLField(max_length=500, default='https://youtube.com', blank=True)
    whatsapp_number = models.CharField(max_length=50, default='+8801700000000', blank=True)
    footer_copyright = models.CharField(
        max_length=255,
        default='© 2026 VIBEMART. ALL RIGHTS RESERVED.',
        blank=True
    )
    CURRENCY_CHOICES = [
        ('BDT', 'BDT (৳) - Bangladeshi Taka'),
        ('USD', 'USD ($) - US Dollar'),
        ('EUR', 'EUR (€) - Euro'),
        ('GBP', 'GBP (£) - British Pound'),
        ('INR', 'INR (₹) - Indian Rupee'),
        ('SAR', 'SAR (﷼) - Saudi Riyal'),
        ('AED', 'AED (د.إ) - UAE Dirham'),
        ('CAD', 'CAD ($) - Canadian Dollar'),
    ]
    currency_code = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default='BDT')
    last_updated = models.DateTimeField(auto_now=True)


    class Meta:
        verbose_name = 'Site Setting'
        verbose_name_plural = 'Site Settings'

    def __str__(self):
        return f"Site Settings ({self.site_title})"

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj


class CourierProvider(models.Model):
    PROVIDER_STEADFAST = 'steadfast'
    PROVIDER_PATHAO = 'pathao'
    PROVIDER_REDX = 'redx'
    PROVIDER_PAPERFLY = 'paperfly'

    PROVIDER_CHOICES = [
        (PROVIDER_STEADFAST, 'Steadfast Courier'),
        (PROVIDER_PATHAO, 'Pathao Courier'),
        (PROVIDER_REDX, 'RedX Delivery'),
        (PROVIDER_PAPERFLY, 'Paperfly'),
    ]

    name = models.CharField(max_length=150)
    provider_code = models.CharField(max_length=30, choices=PROVIDER_CHOICES, default=PROVIDER_STEADFAST)
    api_key = models.CharField(max_length=255, blank=True, null=True)

    secret_key = models.CharField(max_length=255, blank=True, null=True)
    client_id = models.CharField(max_length=150, blank=True, null=True)
    base_url = models.URLField(max_length=500, blank=True, null=True)
    tracking_url_template = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="e.g. https://steadfast.com.bd/t/{tracking_code}"
    )
    is_active = models.BooleanField(default=True)
    is_sandbox = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_active', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_provider_code_display()})"


class ReturnRequest(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_PICKED_UP = 'picked_up'
    STATUS_REFUNDED = 'refunded'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Return Requested'),
        (STATUS_APPROVED, 'Return Approved & Pickup Scheduled'),
        (STATUS_PICKED_UP, 'Parcel Picked Up'),
        (STATUS_REFUNDED, 'Returned & Refund Completed'),
        (STATUS_REJECTED, 'Return Rejected'),
        (STATUS_CANCELLED, 'Cancelled by Customer'),
    ]

    REASON_DAMAGED = 'damaged'
    REASON_WRONG_ITEM = 'wrong_item'
    REASON_NOT_AS_DESCRIBED = 'not_as_described'
    REASON_MISSING_ITEMS = 'missing_items'
    REASON_SIZE_FIT = 'size_fit'
    REASON_OTHER = 'other'

    REASON_CHOICES = [
        (REASON_DAMAGED, 'Damaged / Defective Product'),
        (REASON_WRONG_ITEM, 'Wrong Product or Variant Received'),
        (REASON_NOT_AS_DESCRIBED, 'Item Does Not Match Description'),
        (REASON_MISSING_ITEMS, 'Missing Items / Accessories'),
        (REASON_SIZE_FIT, 'Size / Fit Issue'),
        (REASON_OTHER, 'Other Reason'),
    ]

    REFUND_VIBECOIN = 'vibecoin'
    REFUND_BKASH = 'bkash'
    REFUND_NAGAD = 'nagad'

    REFUND_METHOD_CHOICES = [
        (REFUND_VIBECOIN, 'VibeCoin Wallet (Instant Store Credit)'),
        (REFUND_BKASH, 'bKash Mobile Banking'),
        (REFUND_NAGAD, 'Nagad Mobile Banking'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='return_requests')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='return_requests')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_PENDING)
    reason = models.CharField(max_length=50, choices=REASON_CHOICES, default=REASON_DAMAGED)
    customer_note = models.TextField(blank=True, default='')

    refund_method = models.CharField(max_length=30, choices=REFUND_METHOD_CHOICES, default=REFUND_VIBECOIN)
    refund_account_number = models.CharField(max_length=100, blank=True, default='')

    proof_image_1 = models.ImageField(upload_to='returns/proofs/', blank=True, null=True)
    proof_image_2 = models.ImageField(upload_to='returns/proofs/', blank=True, null=True)
    proof_image_3 = models.ImageField(upload_to='returns/proofs/', blank=True, null=True)

    # 200 words limit for admin note (~1200 characters max)
    admin_note = models.CharField(max_length=1500, blank=True, default='')
    refund_transaction_id = models.CharField(max_length=150, blank=True, default='')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    refunded_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Return #{self.id} for Order #{self.order_id} ({self.get_status_display()})"


class ReturnItem(models.Model):
    return_request = models.ForeignKey(ReturnRequest, on_delete=models.CASCADE, related_name='items')
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='return_items')
    quantity = models.PositiveSmallIntegerField(default=1)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"ReturnItem #{self.id} ({self.quantity}x item #{self.order_item_id})"


