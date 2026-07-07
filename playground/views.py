from django.shortcuts import render
from django.http import HttpResponse
from django.db.models import Q,F
from store.models import Product,OrderItem,Order,Customer


def say_hello(request):
    #query_set = Product.objects.filter(unit_price__range=(20, 30))
    #query_set = Product.objects.values('id','title','collection__title')
    #query_set = Product.objects.filter(id__in=OrderItem.objects.values('product_id').distinct()).order_by('title')
    query_set = Order.objects.select_related('customer').prefetch_related('orderitem_set__product').order_by('-placed_at')[:5]

    return render(request, 'hello.html', {'name': 'Seum', 'orders': list(query_set)})
