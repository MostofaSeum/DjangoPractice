from .permissions import ViewCustomerHistoryPermission
from rest_framework.decorators import action
from store.models import OrderItem
from django.http import request
from store.serializers import ProductSerializers,CollectionSerializer,CollectionDetailSerializer,ReviewSerializer,CartSerializers,CartItemSerializers,AddCartItemSerializers,UpdateCartItemSerializers,CustomerSerializers,OrderSerializer,CreateOrderSerializer,UpdateOrderSerializer,ProductImageSerializer,ProductVariantSerializer,GiftCardSerializer,WishlistItemSerializer,SubscriberSerializer,PromotionSerializer,CouponSerializer
from store.models import Collection,Product,Review,Cart,CartItem,Customer,Order,ProductImage,ProductVariant,GiftCard,WishlistItem,Subscriber,Promotion,Coupon
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
    
    @action(detail=False, methods=['get'], pagination_class=None)
    def all(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        if OrderItem.objects.filter(product_id=kwargs['pk']).count() > 0:
            return Response({'error': 'Product cannot be deleted because it is associated with an order item.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        super().destroy(request, *args, **kwargs)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionViewSet(ModelViewSet):
    queryset = Collection.objects.annotate(product_count=Count('product')).all()
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title']
    ordering_fields = ['title', 'product_count']

    def get_queryset(self):
        if self.action == 'retrieve':
            return Collection.objects.prefetch_related('product_set__images').all()
        return Collection.objects.annotate(product_count=Count('product')).all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CollectionDetailSerializer
        return CollectionSerializer

    def destroy(self, request, *args, **kwargs):
        if Product.objects.filter(collection_id=kwargs['pk']).count() > 0:
            return Response({'error': 'Collection cannot be deleted because it includes one or more products.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        return super().destroy(request, *args, **kwargs)


class ReviewViewSet(ModelViewSet):
    serializer_class = ReviewSerializer
    def get_queryset(self):
        return Review.objects.filter(product_id=self.kwargs['product_pk']).prefetch_related('images')
        
    def get_serializer_context(self):
        return {'product_id' : self.kwargs['product_pk'], 'request': self.request}

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

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def sync(self, request):
        guest_cart_id = request.data.get('cart_id')
        customer, _ = Customer.objects.get_or_create(user_id=request.user.id)

        user_cart = Cart.objects.filter(customer=customer).prefetch_related('items__product').first()

        if guest_cart_id:
            try:
                guest_cart = Cart.objects.filter(id=guest_cart_id).prefetch_related('items__product').first()
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


    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateOrderSerializer
        elif self.request.method == 'PATCH':
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
            updated_count = Product.objects.filter(collection_id=collection_id).update(discount_percent=discount_val)
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

            updated_count = Product.objects.filter(pk__in=product_ids).update(discount_percent=discount_val)
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

        promotion = Promotion.objects.create(description=description, discount=discount_val)

        return Response({
            'message': f'Successfully applied {discount_val}% discount to {updated_count} product(s).',
            'promotion': PromotionSerializer(promotion).data,
            'updated_count': updated_count
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def remove(self, request):
        target_type = request.data.get('target_type')
        if target_type == 'all':
            updated_count = Product.objects.filter(discount_percent__gt=0).update(discount_percent=0.00)
            Promotion.objects.all().delete()
            return Response({'message': f'Successfully removed all active promotions from {updated_count} product(s).', 'updated_count': updated_count})
        elif target_type == 'collection':
            collection_id = request.data.get('collection_id')
            updated_count = Product.objects.filter(collection_id=collection_id).update(discount_percent=0.00)
        elif target_type == 'product':
            product_id = request.data.get('product_id')
            updated_count = Product.objects.filter(pk=product_id).update(discount_percent=0.00)
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