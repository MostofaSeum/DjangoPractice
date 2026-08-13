from .permissions import ViewCustomerHistoryPermission
from rest_framework.decorators import action
from store.models import OrderItem
from django.http import request
from store.serializers import ProductSerializers,CollectionSerializer,CollectionDetailSerializer,ReviewSerializer,CartSerializers,CartItemSerializers,AddCartItemSerializers,UpdateCartItemSerializers,CustomerSerializers,OrderSerializer,CreateOrderSerializer,UpdateOrderSerializer,ProductImageSerializer,GiftCardSerializer
from store.models import Collection,Product,Review,Cart,CartItem,Customer,Order,ProductImage,GiftCard
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
# Create your views here.
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.prefetch_related('images').all()
    serializer_class = ProductSerializers
    filter_backends = [DjangoFilterBackend,SearchFilter,OrderingFilter]
    pagination_class = PageNumberPagination
    filterset_class = ProductFilter
    search_fields = ['title','description']
    ordering_fields = ['unit_price','last_update']
    permission_classes = [IsAdminOrReadOnly]
    def get_serializer_context(self):
        return {'request': self.request}
    
    def destroy(self, request, *args, **kwargs):
        if OrderItem.objects.filter(product_id=kwargs['pk']).count() > 0:
            return Response({'error': 'Product cannot be deleted because it is associated with an order item.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
        super().destroy(request, *args, **kwargs)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionViewSet(ModelViewSet):
    queryset = Collection.objects.annotate(product_count=Count('product')).all()
    serializer_class = CollectionSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
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


class CartViewSet(CreateModelMixin,GenericViewSet, RetrieveModelMixin, DestroyModelMixin):
    queryset = Cart.objects.prefetch_related('items__product').all()
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
    def me(self, request):
        customer = Customer.objects.get(user_id=request.user.id)
        (cart, _) = Cart.objects.prefetch_related('items__product').get_or_create(customer=customer)
        serializer = CartSerializers(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
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
        return CartItem.objects.filter(cart_id=self.kwargs['cart_pk']).select_related('product')

class CustomerViewSet(ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializers
    permission_classes = [IsAdminUser]

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
            return Order.objects.select_related('customer__user').all()
        customer_id = Customer.objects.only('id').get(user_id = user.id)
        return Order.objects.select_related('customer__user').filter(customer_id=customer_id)

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

# Trigger Django reloader - updated with review image support