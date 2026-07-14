from django.http import request
from store.serializers import CollectionSerializer, CollectionDetailSerializer
from store.models import Collection
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.mixins import ListModelMixin, CreateModelMixin
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework import ModelViewSet
from .models import Product
from .serializers import ProductSerializers

# Create your views here.
class ProductListView(ModelViewSet):
    queryset = Product.objects.select_related('collection').all()
    serializer_class = ProductSerializers
    def get_serializer_context(self):
        return {'request': self.request}

    def delete(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        if product.orderitem_set.count() > 0:
            return Response(status = status.HTTP_405_METHOD_NOT_ALLOWED)
        product.delete()
        return Response(status = status.HTTP_204_NO_CONTENT)



class CollectionList(ListCreateAPIView):
    queryset = Collection.objects.annotate(product_count=Count('product')).all()
    serializer_class = CollectionSerializer


class CollectionDetail(RetrieveUpdateDestroyAPIView):
    queryset = Collection.objects.annotate(product_count=Count('product')).all()
    serializer_class = CollectionDetailSerializer

    def delete(self, request, pk):
        collection = get_object_or_404(Collection, pk=pk)
        collection.delete()
        return Response(status = status.HTTP_204_NO_CONTENT)
