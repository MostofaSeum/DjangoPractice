from store.serializers import CollectionSerializer, CollectionDetailSerializer
from store.models import Collection
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .models import Product
from .serializers import ProductSerializers

# Create your views here.
class ProductList(APIView):
    def get(self, request):
        queryset = Product.objects.select_related('collection').all()
        serializer = ProductSerializers(queryset, many=True)
        return Response(serializer.data)
    def post(self, request):
        serializer = ProductSerializers(data=request.data)
        serializer.is_valid(raise_exception = True)
        serializer.save()
        return Response(serializer.data, status = status.HTTP_201_CREATED)







@api_view(['GET','PUT','DELETE'])
def product_detail(request,id):
    product = get_object_or_404(Product, pk=id)
    if request.method == 'GET':
     serializer = ProductSerializers(product)
     return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ProductSerializers(product, data=request.data)
        serializer.is_valid(raise_exception = True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        if product.orderitem_set.count() > 0:
            return Response(status = status.HTTP_405_METHOD_NOT_ALLOWED)
        product.delete()
        return Response(status = status.HTTP_204_NO_CONTENT)


@api_view(['GET','POST'])
def collection_list(request):
    if request.method == 'GET':
        queryset = Collection.objects.annotate(product_count=Count('product')).all()
        serializer = CollectionSerializer(queryset, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = CollectionSerializer(data=request.data)
        serializer.is_valid(raise_exception = True)
        serializer.save()
        return Response(serializer.data, status = status.HTTP_201_CREATED)


@api_view(['GET','PUT','DELETE'])
def collection_detail(request,id):
    collection = get_object_or_404(Collection, pk=id)
    if request.method == 'GET':
     serializer = CollectionDetailSerializer(collection)
     return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = CollectionSerializer(collection, data=request.data)
        serializer.is_valid(raise_exception = True)
        serializer.save()
        return Response(serializer.data)

    elif request.method == 'DELETE':
        collection.delete()
        return Response(status = status.HTTP_204_NO_CONTENT)