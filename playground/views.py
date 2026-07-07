from django.shortcuts import render
from django.http import HttpResponse
from django.db.models import Q,F
from django.db.models.aggregates import Count,Avg,Sum,Min,Max
from django.db.models import Value,F,Func, ExpressionWrapper
from django.db.models.functions import Concat
from store.models import Product,OrderItem,Order,Customer


def say_hello(request):
    #query_set = Product.objects.filter(unit_price__range=(20, 30))
    #query_set = Product.objects.values('id','title','collection__title')
    #query_set = Product.objects.filter(id__in=OrderItem.objects.values('product_id').distinct()).order_by('title')
    #query_set = Order.objects.select_related('customer').prefetch_related('orderitem_set__product').order_by('-placed_at')[:5]

   # result = Order.objects.aggregate(Count('id'))
   #result = OrderItem.objects.filter(product__id = 1).aggregate(Sum('quantity'))

   #queryset = Customer.objects.annotate(is_new = Value(True))

#    queryset = Customer.objects.annotate(
#     full_name = Func(F('first_name'),Value(' '),F('last_name'),
#     function='CONCAT')
#    )

    #queryset = Customer.objects.annotate(full_name=Concat(('first_name'),Value(' '),('last_name')))
    
    queryset = Customer.object.all()
    
    return render(request, 'hello.html', {'queryset':list(queryset)})
