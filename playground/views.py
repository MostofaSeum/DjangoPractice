from django.shortcuts import render
from django.http import HttpResponse
from django.db.models import Q,F
from store.models import Product,OrderItem


def say_hello(request):
    #query_set = Product.objects.filter(unit_price__range=(20, 30))
    #query_set = Product.objects.values('id','title','collection__title')
    query_set = Product.objects.filter(id__in=OrderItem.objects.values('product_id').distinct()).order_by('title')

    return render(request, 'hello.html', {'name': 'Seum', 'products': list(query_set)})
