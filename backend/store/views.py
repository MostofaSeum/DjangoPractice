import csv
import io
import re
import urllib.request
import urllib.parse
from decimal import Decimal
from django.db import transaction
from django.core.files.base import ContentFile
from django.http import HttpResponse, request
from .permissions import ViewCustomerHistoryPermission
from rest_framework.decorators import action
from store.models import OrderItem
from store.serializers import ProductSerializers,CollectionSerializer,CollectionDetailSerializer,ReviewSerializer,CartSerializers,CartItemSerializers,AddCartItemSerializers,UpdateCartItemSerializers,CustomerSerializers,OrderSerializer,CreateOrderSerializer,UpdateOrderSerializer,AdminEditOrderSerializer,ProductImageSerializer,ProductVariantSerializer,GiftCardSerializer,WishlistItemSerializer,SubscriberSerializer,PromotionSerializer,CouponSerializer,PaymentSettingSerializer,DeliverySettingSerializer,DeliveryRuleSerializer,NotificationSerializer,AddressSerializer
from store.models import Collection,Product,Review,Cart,CartItem,Customer,Order,ProductImage,ProductVariant,GiftCard,WishlistItem,Subscriber,Promotion,Coupon,PaymentSetting,DeliverySetting,DeliveryRule,GoogleSheetSyncSetting,Notification,Address
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter,OrderingFilter
from rest_framework.mixins import CreateModelMixin,RetrieveModelMixin, DestroyModelMixin,UpdateModelMixin
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.viewsets import ModelViewSet,GenericViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from .filters import ProductFilter
from .permissions import IsAdminOrReadOnly
class ProductPagination(PageNumberPagination):
    page_size = 9
    page_size_query_param = 'page_size'
    max_page_size = 1000

# Create your views here.
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.prefetch_related('images', 'variants').annotate(popularity=Count('orderitem')).all()
    serializer_class = ProductSerializers
    filter_backends = [DjangoFilterBackend,SearchFilter,OrderingFilter]
    pagination_class = ProductPagination
    filterset_class = ProductFilter
    search_fields = ['title', 'short_description', 'description']
    ordering_fields = ['unit_price', 'last_update', 'id', 'popularity']
    permission_classes = [IsAdminOrReadOnly]
    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        qs = Product.objects.prefetch_related('images', 'variants').annotate(popularity=Count('orderitem'))
        # If user is not admin staff, only show visible products and products from visible collections
        user = self.request.user if hasattr(self.request, 'user') else None
        is_staff = user and user.is_authenticated and user.is_staff
        if not is_staff:
            qs = qs.filter(is_visible=True, collection__is_visible=True)
        return qs.all()
    
    @action(detail=False, methods=['get'], pagination_class=None)
    def all(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def export_csv(self, request):
        """Export all products and variants as a standard CSV file."""
        products = Product.objects.prefetch_related('variants', 'collection').all()
        
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="vibemart_products_catalog.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'id', 'title', 'collection', 'unit_price', 'discount_percent', 'inventory',
            'short_description', 'description', 'variant_name', 'variant_color_name',
            'variant_color_code', 'variant_size', 'variant_price', 'variant_inventory', 'image_url'
        ])
        
        for p in products:
            collection_name = p.collection.title if p.collection else ''
            variants = list(p.variants.all())
            first_img = p.images.first()
            img_url_str = request.build_absolute_uri(first_img.image.url) if first_img and first_img.image else ''
            
            if variants:
                for v in variants:
                    writer.writerow([
                        p.id, p.title, collection_name, p.unit_price, p.discount_percent, p.inventory,
                        p.short_description, p.description, v.name, v.color_name or '',
                        v.color_code or '', v.size or '', v.price_override or '', v.inventory,
                        img_url_str
                    ])
            else:
                writer.writerow([
                    p.id, p.title, collection_name, p.unit_price, p.discount_percent, p.inventory,
                    p.short_description, p.description, '', '', '', '', '', '',
                    img_url_str
                ])
        
        return response

    @staticmethod
    def _process_product_csv_rows(rows):
        """Helper to parse and upsert rows from CSV into Product & ProductVariant entities."""
        created_count = 0
        updated_count = 0
        errors = []
        
        # Check for empty or invalid structure
        if not rows:
            return {
                'created_count': 0,
                'updated_count': 0,
                'errors': ['The provided document has no data rows.']
            }

        # Check required columns in header
        fieldnames = getattr(rows, 'fieldnames', None)
        if fieldnames is not None:
            clean_headers = [str(h).strip().lower() for h in fieldnames if h]
            if 'title' not in clean_headers:
                return {
                    'created_count': 0,
                    'updated_count': 0,
                    'errors': ["Invalid document structure: Missing required 'title' column in the header."]
                }
        
        # Group rows by product (either by ID or by title if ID is empty)
        grouped = {}
        for index, row in enumerate(rows, start=2): # 1 is header
            # Clean keys (case-insensitive & stripped)
            clean_row = {str(k).strip().lower(): str(v).strip() for k, v in row.items() if k is not None}
            
            title = clean_row.get('title')
            if not title:
                # If row is empty, skip
                if not any(clean_row.values()):
                    continue
                errors.append(f"Row {index}: Missing required 'title' field.")
                continue
            
            prod_id_raw = clean_row.get('id', '')
            prod_key = f"id:{prod_id_raw}" if prod_id_raw and prod_id_raw.isdigit() else f"title:{title.lower()}"
            
            if prod_key not in grouped:
                grouped[prod_key] = {
                    'row_num': index,
                    'id': int(prod_id_raw) if prod_id_raw and prod_id_raw.isdigit() else None,
                    'title': title,
                    'collection': clean_row.get('collection', ''),
                    'unit_price': clean_row.get('unit_price', '0'),
                    'discount_percent': clean_row.get('discount_percent', '0'),
                    'inventory': clean_row.get('inventory', '0'),
                    'short_description': clean_row.get('short_description', ''),
                    'description': clean_row.get('description', ''),
                    'variants': [],
                    'image_urls': []
                }
            
            # Variant row info
            variant_name = clean_row.get('variant_name', '')
            if variant_name:
                grouped[prod_key]['variants'].append({
                    'name': variant_name,
                    'color_name': clean_row.get('variant_color_name', ''),
                    'color_code': clean_row.get('variant_color_code', ''),
                    'size': clean_row.get('variant_size', ''),
                    'price_override': clean_row.get('variant_price', ''),
                    'inventory': clean_row.get('variant_inventory', '0'),
                })

            # Image URL extraction
            img_url = clean_row.get('image_url', '') or clean_row.get('image', '') or clean_row.get('photo', '')
            if img_url and img_url not in grouped[prod_key]['image_urls']:
                grouped[prod_key]['image_urls'].append(img_url)

        with transaction.atomic():
            for prod_key, data in grouped.items():
                try:
                    # Find or create collection
                    collection_name = data['collection']
                    collection_obj = None
                    if collection_name:
                        if collection_name.isdigit():
                            collection_obj = Collection.objects.filter(pk=int(collection_name)).first()
                        if not collection_obj:
                            collection_obj, _ = Collection.objects.get_or_create(title=collection_name)
                    if not collection_obj:
                        collection_obj = Collection.objects.first()
                        if not collection_obj:
                            collection_obj = Collection.objects.create(title="General")

                    # Clean numeric strings (remove currency symbols like ৳, $, BDT, and % signs)
                    raw_price = re.sub(r'[^\d.]', '', data['unit_price'] or '')
                    try:
                        price = Decimal(raw_price) if raw_price else Decimal('0')
                    except Exception:
                        price = Decimal('0')

                    raw_discount = re.sub(r'[^\d.]', '', data['discount_percent'] or '')
                    try:
                        discount = Decimal(raw_discount) if raw_discount else Decimal('0')
                    except Exception:
                        discount = Decimal('0')

                    raw_inv = re.sub(r'[^\d.]', '', data['inventory'] or '')
                    try:
                        inv = int(float(raw_inv)) if raw_inv else 0
                    except Exception:
                        inv = 0

                    product = None
                    is_new = False
                    if data['id']:
                        product = Product.objects.filter(pk=data['id']).first()
                    
                    if not product:
                        product = Product.objects.filter(title__iexact=data['title']).first()

                    slug_val = re.sub(r'[^a-zA-Z0-9]+', '-', data['title'].lower()).strip('-')

                    if product:
                        product.title = data['title']
                        if not product.slug:
                            product.slug = slug_val
                        if price > 0:
                            product.unit_price = price
                        product.discount_percent = max(Decimal('0'), min(Decimal('100'), discount))
                        product.collection = collection_obj
                        if data['short_description']:
                            product.short_description = data['short_description']
                        if data['description']:
                            product.description = data['description']
                        if not data['variants']:
                            product.inventory = inv
                        product.save()
                        updated_count += 1
                    else:
                        product = Product.objects.create(
                            title=data['title'],
                            slug=slug_val or "product",
                            unit_price=price if price > 0 else Decimal('1.00'),
                            discount_percent=max(Decimal('0'), min(Decimal('100'), discount)),
                            inventory=inv,
                            collection=collection_obj,
                            short_description=data['short_description'] or 'Short Description',
                            description=data['description'] or ''
                        )
                        created_count += 1
                        is_new = True

                    # Attach image URLs if provided and product has no images yet or new URLs given
                    if data.get('image_urls'):
                        for u in data['image_urls']:
                            if u.startswith('http://') or u.startswith('https://'):
                                try:
                                    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
                                    with urllib.request.urlopen(req, timeout=10) as img_res:
                                        img_bytes = img_res.read()
                                        filename = u.split('/')[-1].split('?')[0] or f"product_{product.id}.jpg"
                                        if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                                            filename += '.jpg'
                                        
                                        img_obj = ProductImage(product=product)
                                        img_obj.image.save(filename, ContentFile(img_bytes), save=True)
                                except Exception as img_err:
                                    print(f"Failed to download image {u}: {img_err}")

                    # Upsert Variants if provided
                    if data['variants']:
                        for v_data in data['variants']:
                            try:
                                raw_v_inv = re.sub(r'[^\d.]', '', v_data['inventory'] or '')
                                v_inv = int(float(raw_v_inv)) if raw_v_inv else 0
                            except Exception:
                                v_inv = 0
                            
                            v_price = None
                            if v_data['price_override']:
                                try:
                                    raw_v_p = re.sub(r'[^\d.]', '', v_data['price_override'])
                                    v_price = Decimal(raw_v_p) if raw_v_p else None
                                except Exception:
                                    v_price = None

                            variant_obj, _ = ProductVariant.objects.get_or_create(
                                product=product,
                                name=v_data['name'],
                                defaults={
                                    'color_name': v_data['color_name'] or None,
                                    'color_code': v_data['color_code'] or None,
                                    'size': v_data['size'] or None,
                                    'price_override': v_price,
                                    'inventory': v_inv,
                                    'is_active': True,
                                }
                            )
                            if not _:
                                variant_obj.color_name = v_data['color_name'] or None
                                variant_obj.color_code = v_data['color_code'] or None
                                variant_obj.size = v_data['size'] or None
                                variant_obj.price_override = v_price
                                variant_obj.inventory = v_inv
                                variant_obj.is_active = True
                                variant_obj.save()

                except Exception as e:
                    errors.append(f"Row {data['row_num']} ('{data['title']}'): {str(e)}")

        return {
            'created_count': created_count,
            'updated_count': updated_count,
            'errors': errors
        }

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def get_saved_sheet_url(self, request):
        """Retrieve the currently saved Google Sheet URL and metadata."""
        settings = GoogleSheetSyncSetting.get_settings()
        return Response({
            'sheet_url': settings.sheet_url,
            'last_synced_at': settings.last_synced_at,
            'updated_at': settings.updated_at
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def save_google_sheet_url(self, request):
        """Save or update the single Google Sheet URL."""
        sheet_url = request.data.get('url', '').strip()
        settings = GoogleSheetSyncSetting.get_settings()
        settings.sheet_url = sheet_url
        settings.save()
        return Response({
            'message': 'Google Sheet URL saved successfully.',
            'sheet_url': settings.sheet_url,
            'last_synced_at': settings.last_synced_at
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], permission_classes=[IsAdminUser])
    def delete_saved_sheet_url(self, request):
        """Delete/clear the saved Google Sheet URL."""
        settings = GoogleSheetSyncSetting.get_settings()
        settings.sheet_url = ''
        settings.save()
        return Response({
            'message': 'Saved Google Sheet URL deleted successfully.'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def sync_google_sheet(self, request):
        """Fetch a public Google Sheet CSV and upsert all products & variants."""
        sheet_url = request.data.get('url', '').strip()
        if not sheet_url:
            # Fall back to saved URL if available
            settings = GoogleSheetSyncSetting.get_settings()
            sheet_url = settings.sheet_url

        if not sheet_url:
            return Response({'error': 'Google Sheet URL is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Extract Sheet ID using regex
        match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', sheet_url)
        if not match:
            return Response({'error': 'Invalid Google Sheets URL format. Please provide a valid Google Sheets link.'}, status=status.HTTP_400_BAD_REQUEST)

        sheet_id = match.group(1)
        
        # Check if specific gid is in the url
        gid_match = re.search(r'[#&?]gid=([0-9]+)', sheet_url)
        gid = gid_match.group(1) if gid_match else '0'

        export_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"

        try:
            req = urllib.request.Request(
                export_url,
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                content = response.read().decode('utf-8-sig', errors='replace')
        except Exception as e:
            return Response({
                'error': f'Failed to fetch Google Sheet. Make sure the sheet sharing is set to "Anyone with the link can view". Details: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            reader = csv.DictReader(io.StringIO(content))
            result = self._process_product_csv_rows(reader)
            
            # If nothing was created/updated and errors occurred, reject as invalid sync
            if result.get('created_count', 0) == 0 and result.get('updated_count', 0) == 0:
                first_err = result['errors'][0] if result.get('errors') else "No valid product rows found in the document."
                return Response({
                    'error': f'Sync failed: {first_err}',
                    'details': result.get('errors', [])
                }, status=status.HTTP_400_BAD_REQUEST)

            # Update last_synced_at timestamp only if at least 1 product was synced
            settings = GoogleSheetSyncSetting.get_settings()
            settings.last_synced_at = timezone.now()
            settings.save()
            result['last_synced_at'] = settings.last_synced_at
            
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Failed to parse CSV data: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_import_csv(self, request):
        """Import products from an uploaded CSV file."""
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'CSV file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Decode file
            content = file_obj.read().decode('utf-8-sig', errors='replace')
            reader = csv.DictReader(io.StringIO(content))
            result = self._process_product_csv_rows(reader)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Failed to process CSV file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        if OrderItem.objects.filter(product_id=kwargs['pk']).count() > 0:
            return Response({'error': 'Product cannot be deleted because it is associated with an order item.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        super().destroy(request, *args, **kwargs)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionViewSet(ModelViewSet):
    queryset = Collection.objects.annotate(product_count=Count('product')).order_by('title').all()
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title']
    ordering_fields = ['title', 'product_count']
    ordering = ['title']

    def get_queryset(self):
        user = self.request.user if hasattr(self.request, 'user') else None
        is_staff = user and user.is_authenticated and user.is_staff

        if self.action == 'retrieve' and self.request.query_params.get('include_products') == 'true':
            qs = Collection.objects.prefetch_related('product_set__images', 'product_set__variants')
            if not is_staff:
                qs = qs.filter(is_visible=True)
            return qs.all()

        qs = Collection.objects.annotate(product_count=Count('product'))
        if not is_staff:
            qs = qs.filter(is_visible=True)
        return qs.all()

    def get_serializer_class(self):
        if self.action == 'retrieve' and self.request.query_params.get('include_products') == 'true':
            return CollectionDetailSerializer
        return CollectionSerializer

    def destroy(self, request, *args, **kwargs):
        if Product.objects.filter(collection_id=kwargs['pk']).count() > 0:
            return Response({'error': 'Collection cannot be deleted because it includes one or more products.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        return super().destroy(request, *args, **kwargs)


class ReviewViewSet(ModelViewSet):
    serializer_class = ReviewSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['rating']
    search_fields = ['name', 'description', 'product__title']
    ordering_fields = ['date', 'rating']
    ordering = ['-date']

    def get_queryset(self):
        product_pk = self.kwargs.get('product_pk')
        if product_pk:
            return Review.objects.filter(product_id=product_pk).select_related('product').prefetch_related('images')
        return Review.objects.select_related('product').prefetch_related('images').all()
        
    def get_serializer_context(self):
        return {'product_id': self.kwargs.get('product_pk'), 'request': self.request}

    def update(self, request, *args, **kwargs):
        review = self.get_object()
        if request.user.is_authenticated and (review.user == request.user or request.user.is_staff):
            return super().update(request, *args, **kwargs)
        return Response({'error': 'You can only edit your own reviews.'}, status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        if request.user.is_authenticated and (review.user == request.user or request.user.is_staff):
            return super().destroy(request, *args, **kwargs)
        return Response({'error': 'You can only delete your own reviews.'}, status=status.HTTP_403_FORBIDDEN)


class CartViewSet(CreateModelMixin,GenericViewSet, RetrieveModelMixin, DestroyModelMixin):
    queryset = Cart.objects.prefetch_related('items__product', 'items__variant').all()
    serializer_class = CartSerializers

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            customer = Customer.objects.get(user_id=self.request.user.id)
            user_cart = Cart.objects.filter(customer=customer).first()
            if user_cart:
                serializer.instance = user_cart
                return
            serializer.save(customer=customer)
        else:
            serializer.save()

    @action(detail=False, methods=['GET', 'POST'], permission_classes=[IsAuthenticated])
    def sync(self, request):
        guest_cart_id = request.data.get('cart_id') if request.method == 'POST' else request.query_params.get('cart_id')
        customer, _ = Customer.objects.get_or_create(user_id=request.user.id)

        user_cart = Cart.objects.filter(customer=customer).prefetch_related('items__product', 'items__variant').first()

        if guest_cart_id:
            try:
                guest_cart = Cart.objects.filter(id=guest_cart_id).prefetch_related('items__product', 'items__variant').first()
                if guest_cart:
                    if not user_cart:
                        guest_cart.customer = customer
                        guest_cart.save()
                        user_cart = guest_cart
                    elif user_cart.id != guest_cart.id:
                        for item in guest_cart.items.all():
                            cart_item, created = CartItem.objects.get_or_create(
                                cart=user_cart,
                                product=item.product,
                                variant=item.variant,
                                defaults={'quantity': item.quantity}
                            )
                            if not created:
                                cart_item.quantity += item.quantity
                                cart_item.save()
                        guest_cart.delete()
            except Exception as e:
                print("Cart sync exception:", e)

        if not user_cart:
            user_cart, _ = Cart.objects.get_or_create(customer=customer)

        user_cart = Cart.objects.prefetch_related('items__product', 'items__variant').get(id=user_cart.id)
        serializer = CartSerializers(user_cart)
        return Response(serializer.data)

class CartItemViewSet(ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'delete']
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AddCartItemSerializers
        elif self.request.method == 'PATCH':
            return UpdateCartItemSerializers
        return CartItemSerializers
    def get_serializer_context(self):
        return {'cart_id' : self.kwargs['cart_pk']}
    def get_queryset(self):
        return CartItem.objects.filter(cart_id=self.kwargs['cart_pk']).select_related('product', 'variant')

class ProductVariantViewSet(ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = ProductVariantSerializer
    pagination_class = None

    def get_queryset(self):
        product_pk = self.kwargs.get('product_pk')
        if product_pk:
            return ProductVariant.objects.filter(product_id=product_pk)
        return ProductVariant.objects.all()

    def get_serializer_context(self):
        return {
            'product_id': self.kwargs.get('product_pk'),
            'request': self.request,
            'view': self
        }

class ProductImageViewSet(ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = ProductImageSerializer
    
    def get_queryset(self):
        return ProductImage.objects.filter(product_id=self.kwargs['product_pk'])
    
    def get_serializer_context(self):
        return {'product_id': self.kwargs['product_pk']}

class GiftCardViewSet(ModelViewSet):
    queryset = GiftCard.objects.all()
    serializer_class = GiftCardSerializer
    permission_classes = [AllowAny]

class CustomerViewSet(ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializers
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'user__username', 'phone']
    pagination_class = None

    def get_queryset(self):
        return Customer.objects.select_related('user').filter(user__is_staff=False)

    @action(detail=True, permission_classes=[ViewCustomerHistoryPermission])
    def history(self, request, pk):
        orders = Order.objects.filter(customer_id=pk).select_related('customer__user').prefetch_related('items__product')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods = ['GET','PUT'], permission_classes = [IsAuthenticated])
    def me(self,request):
        customer = Customer.objects.select_related('user').get(user_id=request.user.id)
        if request.method == 'GET':
            serializer = CustomerSerializers(customer)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = CustomerSerializers(customer, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


class AddressViewSet(ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Address.objects.filter(customer__user=self.request.user)

    def get_serializer_context(self):
        customer = Customer.objects.filter(user=self.request.user).first()
        return {'customer': customer, 'request': self.request}

    def perform_create(self, serializer):
        customer, _ = Customer.objects.get_or_create(user=self.request.user)
        serializer.save(customer=customer)

    def perform_destroy(self, instance):
        customer = instance.customer
        was_default = instance.is_default
        instance.delete()
        if was_default:
            first_remaining = customer.addresses.first()
            if first_remaining:
                first_remaining.is_default = True
                first_remaining.save()

    @action(detail=True, methods=['POST'], permission_classes=[IsAuthenticated])
    def set_default(self, request, pk=None):
        address = self.get_object()
        customer = address.customer
        customer.addresses.filter(is_default=True).update(is_default=False)
        address.is_default = True
        address.save()
        serializer = self.get_serializer(address)
        return Response(serializer.data)


class OrderViewSet(ModelViewSet):
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['payment_status', 'payment_method']
    search_fields = ['id', 'customer__user__first_name', 'customer__user__last_name', 'customer__user__email', 'phone', 'shipping_address']
    ordering_fields = ['placed_at', 'id', 'payment_status']
    ordering = ['-placed_at']

    def get_permissions(self):
        if self.request.method in ['PATCH', 'DELETE']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def create(self,request, *args, **kwargs):
        serializer = CreateOrderSerializer(data = request.data, context = {'user_id' : request.user.id})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        serializer = OrderSerializer(order)
        return Response(serializer.data)


    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateOrderSerializer
        elif self.request.method in ['PATCH', 'PUT']:
            if self.request.user.is_staff and ('items' in self.request.data or 'shipping_address' in self.request.data or 'phone' in self.request.data or 'delivery_area' in self.request.data):
                return AdminEditOrderSerializer
            return UpdateOrderSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.select_related('customer__user').prefetch_related('items__product', 'items__variant').all()
        customer_id = Customer.objects.only('id').get(user_id = user.id)
        return Order.objects.select_related('customer__user').prefetch_related('items__product', 'items__variant').filter(customer_id=customer_id)

    def destroy(self, request, *args, **kwargs):
        order = self.get_object()
        order.items.all().delete()
        return super().destroy(request, *args, **kwargs)

class ProductImageViewSet(ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = ProductImageSerializer
    
    def get_queryset(self):
        return ProductImage.objects.filter(product_id=self.kwargs['product_pk'])
    
    def get_serializer_context(self):
        return {'product_id': self.kwargs['product_pk']}


class GiftCardViewSet(ModelViewSet):
    queryset = GiftCard.objects.all()
    serializer_class = GiftCardSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['user_email', 'is_used']
    search_fields = ['card_code', 'user_email']
    ordering_fields = ['created_at', 'expiry_date']

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def denominations(self, request):
        prices = [500, 1000, 1500, 2000, 2500, 3000]
        options = [
            {"price": p, "title": f"${p:,} Gift Card"}
            for p in prices
        ]
        return Response(options)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def redeem(self, request):
        code = request.data.get('card_code', '').strip()
        if not code:
            return Response({'error': 'Please enter a gift card code.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            gift_card = GiftCard.objects.get(card_code=code)
            if gift_card.is_used:
                return Response({'error': 'This gift card has already been redeemed.', 'is_used': True}, status=status.HTTP_400_BAD_REQUEST)

            # Validate that logged-in user email matches the gift card email
            user_email = (request.user.email or '').strip().lower()
            card_email = (gift_card.user_email or '').strip().lower()

            if not user_email or user_email != card_email:
                return Response({
                    'error': 'Invalid gift card code. Please try again.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Credit vibe_coin to customer profile in database
            customer, _ = Customer.objects.get_or_create(user=request.user)
            coin_amount = gift_card.price
            customer.vibe_coin += coin_amount
            customer.save()

            # Mark gift card as used
            gift_card.is_used = True
            gift_card.save()

            return Response({
                'valid': True,
                'card_code': gift_card.card_code,
                'price': str(gift_card.price),
                'vibe_coins_added': str(coin_amount),
                'new_vibe_coin_balance': str(customer.vibe_coin),
                'expiry_date': gift_card.expiry_date.strftime('%Y-%m-%d'),
                'message': f'Congratulations! Your gift card was successfully redeemed and {coin_amount} VibeCoins have been added to your profile.'
            })
        except GiftCard.DoesNotExist:
            return Response({'error': 'Invalid gift card code. Please try again.'}, status=status.HTTP_404_NOT_FOUND)


class WishlistViewSet(ModelViewSet):
    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).select_related('product').prefetch_related('product__images')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['delete', 'post'])
    def toggle(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        existing = WishlistItem.objects.filter(user=request.user, product_id=product_id)
        if existing.exists():
            existing.delete()
            return Response({'in_wishlist': False, 'message': 'Removed from wishlist'})
        else:
            WishlistItem.objects.create(user=request.user, product_id=product_id)
            return Response({'in_wishlist': True, 'message': 'Added to wishlist'})


class SubscriberViewSet(ModelViewSet):
    queryset = Subscriber.objects.all()
    serializer_class = SubscriberSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if Subscriber.objects.filter(email__iexact=email).exists():
            return Response(
                {'error': 'We already have you! No duplicate entries allowed.', 'is_duplicate': True},
                status=status.HTTP_400_BAD_REQUEST
            )

        subscriber = Subscriber.objects.create(email=email)
        serializer = self.get_serializer(subscriber)
        return Response(
            {'message': 'The mail is added. We will reach you soon.', 'data': serializer.data},
            status=status.HTTP_201_CREATED
        )


class PromotionViewSet(ModelViewSet):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def apply(self, request):
        target_type = request.data.get('target_type')
        discount_percent = request.data.get('discount_percent')
        valid_until = request.data.get('valid_until') or None
        description = request.data.get('description', '')

        if discount_percent is None:
            return Response({'error': 'discount_percent is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            discount_val = float(discount_percent)
            if discount_val < 0 or discount_val > 100:
                return Response({'error': 'discount_percent must be between 0 and 100.'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Invalid discount percentage.'}, status=status.HTTP_400_BAD_REQUEST)

        updated_count = 0
        if target_type == 'collection':
            collection_id = request.data.get('collection_id')
            if not collection_id:
                return Response({'error': 'collection_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
            updated_count = Product.objects.filter(collection_id=collection_id).update(
                discount_percent=discount_val,
                discount_valid_until=valid_until
            )
            if not description:
                try:
                    col = Collection.objects.get(pk=collection_id)
                    description = f"Collection '{col.title}' ({discount_val}% OFF)"
                except Collection.DoesNotExist:
                    description = f"Collection #{collection_id} ({discount_val}% OFF)"

        elif target_type in ['product', 'products']:
            product_ids = request.data.get('product_ids')
            if not product_ids:
                single_id = request.data.get('product_id')
                if single_id:
                    product_ids = [single_id]
                else:
                    return Response({'error': 'product_ids is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if isinstance(product_ids, (int, str)):
                product_ids = [product_ids]

            updated_count = Product.objects.filter(pk__in=product_ids).update(
                discount_percent=discount_val,
                discount_valid_until=valid_until
            )
            if not description:
                if len(product_ids) == 1:
                    try:
                        prod = Product.objects.get(pk=product_ids[0])
                        description = f"Product '{prod.title}' ({discount_val}% OFF)"
                    except Product.DoesNotExist:
                        description = f"Product #{product_ids[0]} ({discount_val}% OFF)"
                else:
                    description = f"{updated_count} Products ({discount_val}% OFF)"
        else:
            return Response({'error': 'Invalid target_type. Must be "product" or "collection".'}, status=status.HTTP_400_BAD_REQUEST)

        promotion = Promotion.objects.create(
            description=description,
            discount=discount_val,
            valid_until=valid_until
        )

        return Response({
            'message': f'Successfully applied {discount_val}% discount to {updated_count} product(s).',
            'promotion': PromotionSerializer(promotion).data,
            'updated_count': updated_count
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def remove(self, request):
        target_type = request.data.get('target_type')
        if target_type == 'all':
            updated_count = Product.objects.filter(discount_percent__gt=0).update(discount_percent=0.00, discount_valid_until=None)
            Promotion.objects.all().delete()
            return Response({'message': f'Successfully removed all active promotions from {updated_count} product(s).', 'updated_count': updated_count})
        elif target_type == 'collection':
            collection_id = request.data.get('collection_id')
            updated_count = Product.objects.filter(collection_id=collection_id).update(discount_percent=0.00, discount_valid_until=None)
        elif target_type == 'product':
            product_id = request.data.get('product_id')
            updated_count = Product.objects.filter(pk=product_id).update(discount_percent=0.00, discount_valid_until=None)
        else:
            return Response({'error': 'Invalid target_type. Must be "all", "product", or "collection".'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': f'Removed promotion from {updated_count} product(s).', 'updated_count': updated_count})


class CouponViewSet(ModelViewSet):
    queryset = Coupon.objects.prefetch_related('products').select_related('collection').all()
    serializer_class = CouponSerializer
    pagination_class = None
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def validate(self, request):
        raw_code = request.data.get('code', '')
        code = str(raw_code).strip().upper()
        cart_items = request.data.get('cart_items', [])

        if not code:
            return Response({'valid': False, 'error': 'Coupon code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(code) > 20:
            return Response({'valid': False, 'error': 'Coupon code cannot exceed 20 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = Coupon.objects.prefetch_related('products').select_related('collection').get(code__iexact=code)
        except Coupon.DoesNotExist:
            return Response({'valid': False, 'error': f'Coupon "{code}" does not exist.'}, status=status.HTTP_404_NOT_FOUND)

        if not coupon.is_active:
            return Response({'valid': False, 'error': f'Coupon "{coupon.code}" is currently disabled.'}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        if coupon.valid_to and now > coupon.valid_to:
            formatted_date = coupon.valid_to.strftime('%b %d, %Y')
            return Response({'valid': False, 'error': f'Coupon "{coupon.code}" expired on {formatted_date}.'}, status=status.HTTP_400_BAD_REQUEST)

        if coupon.valid_from and now < coupon.valid_from:
            return Response({'valid': False, 'error': f'Coupon "{coupon.code}" is not active yet.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart_items or not isinstance(cart_items, list):
            return Response({'valid': False, 'error': 'Cart items are required to validate this coupon.'}, status=status.HTTP_400_BAD_REQUEST)

        # Extract product IDs and check applicability
        applicable_product_ids = []
        discount_percent = float(coupon.discount_percent)

        if coupon.target_type == 'product':
            valid_product_ids = set(coupon.products.values_list('id', flat=True))
            for item in cart_items:
                p_id = item.get('product_id') or (item.get('product') and item.get('product', {}).get('id'))
                if p_id and int(p_id) in valid_product_ids:
                    applicable_product_ids.append(int(p_id))

            if not applicable_product_ids:
                return Response({
                    'valid': False,
                    'error': f'Coupon "{coupon.code}" is only valid for specific products not currently in your cart.'
                }, status=status.HTTP_400_BAD_REQUEST)

        elif coupon.target_type == 'collection':
            collection_id = coupon.collection_id
            product_ids_in_cart = []
            for item in cart_items:
                p_id = item.get('product_id') or (item.get('product') and item.get('product', {}).get('id'))
                if p_id:
                    product_ids_in_cart.append(int(p_id))

            matching_products = Product.objects.filter(id__in=product_ids_in_cart, collection_id=collection_id).values_list('id', flat=True)
            applicable_product_ids = list(matching_products)

            if not applicable_product_ids:
                col_name = coupon.collection.title if coupon.collection else f"Collection #{collection_id}"
                return Response({
                    'valid': False,
                    'error': f'Coupon "{coupon.code}" is only valid for items in the "{col_name}" collection.'
                }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_percent': discount_percent,
            'target_type': coupon.target_type,
            'applicable_product_ids': applicable_product_ids,
            'message': f'Coupon "{coupon.code}" applied! {discount_percent}% discount applied on eligible item(s).'
        }, status=status.HTTP_200_OK)


class PaymentSettingViewSet(GenericViewSet):
    serializer_class = PaymentSettingSerializer
    pagination_class = None

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            return [IsAdminUser()]
        return [AllowAny()]

    def list(self, request):
        settings = PaymentSetting.get_settings()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)

    def create(self, request):
        settings = PaymentSetting.get_settings()
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DeliverySettingViewSet(GenericViewSet):
    serializer_class = DeliverySettingSerializer
    pagination_class = None

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            return [IsAdminUser()]
        return [AllowAny()]

    def list(self, request):
        settings = DeliverySetting.get_settings()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)

    def create(self, request):
        settings = DeliverySetting.get_settings()
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DeliveryRuleViewSet(ModelViewSet):
    queryset = DeliveryRule.objects.prefetch_related('products').select_related('collection').all()
    serializer_class = DeliveryRuleSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'collection__title', 'products__title']
    ordering_fields = ['created_at', 'title', 'is_active']
    ordering = ['-created_at']


class NotificationViewSet(ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminUser]
    pagination_class = None
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Notification.objects.all()
        since_id = self.request.query_params.get('since_id')
        if since_id and since_id.isdigit():
            qs = qs.filter(id__gt=int(since_id))
        return qs[:50]

    def _check_expiring_items(self):
        """Check for active promotions and coupons expiring within 24 hours and generate notifications."""
        now = timezone.now()
        twenty_four_hours_later = now + timedelta(hours=24)

        def format_time_left(total_seconds):
            total_minutes = max(1, int(total_seconds / 60))
            hours = total_minutes // 60
            mins = total_minutes % 60
            if hours > 0 and mins > 0:
                return f"{hours}h {mins}m"
            elif hours > 0:
                return f"{hours} hours"
            else:
                return f"{mins} min"

        # 1. Check Expiring Promotions
        expiring_promos = Promotion.objects.filter(
            valid_until__isnull=False,
            valid_until__gt=now,
            valid_until__lte=twenty_four_hours_later
        )
        for promo in expiring_promos:
            target_key = f"promo_exp_{promo.id}_{promo.valid_until.strftime('%Y%m%d%H%M')}"
            # Check if notification already exists
            if not Notification.objects.filter(notification_type=Notification.TYPE_PROMOTION, target_id=target_key).exists():
                time_left_str = format_time_left((promo.valid_until - now).total_seconds())
                Notification.objects.create(
                    title=f"Promotion Expiring Soon!",
                    message=f"Only {time_left_str} left before promotion '{promo.description}' ({promo.discount}% OFF) expires.",
                    notification_type=Notification.TYPE_PROMOTION,
                    target_id=target_key,
                    is_read=False
                )

        # 2. Check Expiring Products with custom discount_valid_until
        expiring_products = Product.objects.filter(
            discount_percent__gt=0,
            discount_valid_until__isnull=False,
            discount_valid_until__gt=now,
            discount_valid_until__lte=twenty_four_hours_later
        )
        for prod in expiring_products:
            target_key = f"prod_promo_exp_{prod.id}_{prod.discount_valid_until.strftime('%Y%m%d%H%M')}"
            if not Notification.objects.filter(notification_type=Notification.TYPE_PROMOTION, target_id=target_key).exists():
                time_left_str = format_time_left((prod.discount_valid_until - now).total_seconds())
                Notification.objects.create(
                    title=f"Product Promotion Expiring Soon!",
                    message=f"Only {time_left_str} left before {prod.discount_percent}% discount on '{prod.title}' expires.",
                    notification_type=Notification.TYPE_PROMOTION,
                    target_id=target_key,
                    is_read=False
                )

        # 3. Check Expiring Coupons
        expiring_coupons = Coupon.objects.filter(
            is_active=True,
            valid_to__isnull=False,
            valid_to__gt=now,
            valid_to__lte=twenty_four_hours_later
        )
        for coupon in expiring_coupons:
            target_key = f"coupon_exp_{coupon.id}_{coupon.valid_to.strftime('%Y%m%d%H%M')}"
            if not Notification.objects.filter(notification_type=Notification.TYPE_COUPON, target_id=target_key).exists():
                time_left_str = format_time_left((coupon.valid_to - now).total_seconds())
                Notification.objects.create(
                    title=f"Coupon Code Expiring Soon!",
                    message=f"Only {time_left_str} left before coupon '{coupon.code}' ({coupon.discount_percent}% OFF) expires.",
                    notification_type=Notification.TYPE_COUPON,
                    target_id=target_key,
                    is_read=False
                )

    def list(self, request, *args, **kwargs):
        try:
            self._check_expiring_items()
        except Exception as e:
            print(f"Error checking expiring items: {e}")

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        unread_count = Notification.objects.filter(is_read=False).count()
        return Response({
            'unread_count': unread_count,
            'notifications': serializer.data
        })

    @action(detail=True, methods=['patch', 'post'])
    def mark_read(self, request, pk=None):
        try:
            notification = self.get_object()
            notification.is_read = True
            notification.save(update_fields=['is_read'])
            return Response(self.get_serializer(notification).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read.'}, status=status.HTTP_200_OK)