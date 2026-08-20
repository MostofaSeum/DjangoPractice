from django.urls import path
from rest_framework_nested import routers
from . import views

router = routers.DefaultRouter()
router.register('products', views.ProductViewSet, basename='products')
router.register('reviews', views.ReviewViewSet, basename='reviews')
router.register('collections', views.CollectionViewSet)
router.register('carts', views.CartViewSet)
router.register('customers', views.CustomerViewSet)
router.register('orders',views.OrderViewSet, basename='orders')
router.register('gift-cards', views.GiftCardViewSet, basename='gift-cards')
router.register('wishlist', views.WishlistViewSet, basename='wishlist')
router.register('subscribers', views.SubscriberViewSet, basename='subscribers')
router.register('promotions', views.PromotionViewSet, basename='promotions')
router.register('coupons', views.CouponViewSet, basename='coupons')
router.register('variants', views.ProductVariantViewSet, basename='variants')
router.register('payment-settings', views.PaymentSettingViewSet, basename='payment-settings')
router.register('delivery-settings', views.DeliverySettingViewSet, basename='delivery-settings')
router.register('delivery-rules', views.DeliveryRuleViewSet, basename='delivery-rules')


products_router = routers.NestedDefaultRouter(router, 'products', lookup='product')
products_router.register('reviews', views.ReviewViewSet, basename='product-reviews')
products_router.register('images', views.ProductImageViewSet,
                         basename='product-images')
products_router.register('variants', views.ProductVariantViewSet,
                         basename='product-variants')

carts_router = routers.NestedDefaultRouter(router, 'carts', lookup='cart')
carts_router.register('items', views.CartItemViewSet, basename='cart-items')

urlpatterns = router.urls + products_router.urls + carts_router.urls
# URLConf
# urlpatterns = [
#     # path('products/', views.ProductListCreateAPIView.as_view()),
#     # path('products/<int:pk>/', views.ProductDetails.as_view()),
#     # path('collections/', views.CollectionList.as_view()),
#     # path('collections/<int:pk>/', views.CollectionDetail.as_view()),
# ]
