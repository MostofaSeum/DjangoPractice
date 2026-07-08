from django.db.models import Count
from django.contrib.admin import register
from django.contrib import admin
from . import models

@admin.register(models.Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['title', 'unit_price']
    

@admin.register(models.Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'membership']
    list_editable = ['membership']
    ordering = ['first_name', 'last_name']
    list_per_page = 10

@admin.register(models.Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'placed_at', 'customer_name']
    ordering = ['-placed_at']
    list_per_page = 10
    list_select_related = ['customer']
    
    def customer_name(self,order):
        return f'{order.customer.first_name} {order.customer.last_name}'
        
@admin.register(models.Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'Product_Count']
    ordering = ['title']
    list_per_page = 10
    
    def Product_Count(self,collection):
        return collection.Product_Count
    
    def get_queryset(self,request):
        return super().get_queryset(request).annotate(
            Product_Count=Count('product')
        )
    
# Register your models here.