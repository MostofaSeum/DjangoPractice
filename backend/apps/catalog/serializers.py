from rest_framework import serializers
from apps.catalog.models import Collection, Product, ProductVariant, ProductImage, Review, ReviewImage

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']

    def create(self, validated_data):
        product_id = self.context['product_id']
        return ProductImage.objects.create(product_id=product_id, **validated_data)


class ProductVariantSerializer(serializers.ModelSerializer):
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product', 'name', 'color_name', 'color_code', 'size',
            'price_override', 'effective_price', 'discounted_price',
            'inventory', 'image', 'is_active'
        ]
        extra_kwargs = {'product': {'required': False}}

    def create(self, validated_data):
        product_id = self.context.get('product_id') or (validated_data.get('product').id if validated_data.get('product') else None)
        if not product_id:
            raise serializers.ValidationError({'product': 'Product ID is required.'})
        validated_data['product_id'] = product_id
        return super().create(validated_data)


class CollectionSerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Collection
        fields = ['id', 'title', 'products_count', 'featured_product', 'image', 'is_featured', 'is_visible']


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'date', 'name', 'description', 'rating', 'image']

    def create(self, validated_data):
        product_id = self.context['product_id']
        user = self.context.get('user')
        return Review.objects.create(product_id=product_id, user=user, **validated_data)


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_discount_active = serializers.BooleanField(read_only=True)
    total_inventory = serializers.IntegerField(read_only=True)
    units_sold = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'inventory', 'total_inventory', 'unit_price',
            'discount_percent', 'discounted_price', 'discount_valid_until', 'is_discount_active',
            'collection', 'images', 'short_description', 'description',
            'is_photos_published', 'is_trending', 'is_visible',
            'variants', 'units_sold', 'average_rating', 'review_count'
        ]
