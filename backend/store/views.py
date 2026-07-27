from .permissions import ViewCustomerHistoryPermission
from rest_framework.decorators import action
from store.models import OrderItem
from django.http import request
from store.serializers import ProductSerializers,CollectionSerializer,CollectionDetailSerializer,ReviewSerializer,CartSerializers,CartItemSerializers,AddCartItemSerializers,UpdateCartItemSerializers,CustomerSerializers,OrderSerializer,CreateOrderSerializer,UpdateOrderSerializer
from store.models import Collection,Product,Review,Cart,CartItem,Customer,Order
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
    queryset = Product.objects.all()
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
        return Review.objects.filter(product_id=self.kwargs['product_pk'])
        
    def get_serializer_context(self):
        return {'product_id' : self.kwargs['product_pk']}


class CartViewSet(CreateModelMixin,GenericViewSet, RetrieveModelMixin, DestroyModelMixin):
    queryset = Cart.objects.prefetch_related('items__product').all()
    serializer_class = CartSerializers

    def perform_create(self, serializer):
        if self.request.user and self.request.user.is_authenticated:
            customer, _ = Customer.objects.get_or_create(user_id=self.request.user.id)
            serializer.save(customer=customer)
        else:
            serializer.save()

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def me(self, request):
        (customer, _) = Customer.objects.get_or_create(user_id=request.user.id)
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
            except Exception:
                pass

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

    @action(detail = True,permission_classes=[ViewCustomerHistoryPermission])
    def history(self,request,pk):
        return Response('ok')

    @action(detail=False, methods = ['GET','PUT'], permission_classes = [IsAuthenticated])
    def me(self,request):
        (customer,created) = Customer.objects.get_or_create(user_id=request.user.id)
        if request.method == 'GET':
            serializer = CustomerSerializers(customer)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = CustomerSerializers(customer, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)


class OrderViewSet(ModelViewSet):
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

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
            return Order.objects.all()
        (customer,created) = Customer.objects.only('id').get_or_create(user_id = user.id)
        return Order.objects.filter(customer_id=customer.id)


