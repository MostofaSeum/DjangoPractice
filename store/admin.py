from django.db.models import QuerySet
from re import search
from django.db.models import Count
from django.contrib.admin import register
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from . import models

class InventoryFilter(admin.SimpleListFilter):
    title = 'inventory'
    parameter_name = 'inventory'

    def lookups(self, request, model_admin):
        return [
            ('<10', 'Low')
        ]

    def queryset(self, request, queryset: QuerySet):
        if self.value() == '<10':
            return queryset.filter(inventory__lt=10)
        return queryset


@admin.register(models.Product)
class ProductAdmin(admin.ModelAdmin):
    autocomplete_fields = ['collection']
    prepopulated_fields = {
        'slug': ['title']
    }
    actions = ['clear_inventory']
    list_display = ['title', 'unit_price','inventory_status', 'collection_title']
    list_editable = ['unit_price']
    list_filter = ['collection', 'last_update', InventoryFilter]
    list_per_page = 10
    list_select_related = ['collection']
    search_fields = ['title']

    def collection_title(self, product):
        return product.collection.title

    @admin.display(ordering='inventory')
    def inventory_status(self, product):
        if product.inventory < 10:
            return 'Low'
        return 'OK'

    @admin.action(description='Clear inventory')
    def clear_inventory(self, request, queryset):
        updated_count = queryset.update(inventory=0)
        self.message_user(
            request,
            f'{updated_count} products were successfully updated.'
        )
    

@admin.register(models.Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'membership','order_list']
    list_editable = ['membership']
    ordering = ['first_name', 'last_name']
    list_filter = ['membership']
    list_per_page = 10
    search_fields = ['first_name__istartswith','last_name__istartswith']

    def order_list(self,customer):
        url = (reverse('admin:store_order_changelist')
                +
                '?customer__id='
                +str(customer.id)
                )
        return format_html('<a href="{}">{}</a>',url,customer.order_set.count() )

@admin.register(models.Order)
class OrderAdmin(admin.ModelAdmin):
    autocomplete_fields = ['customer']
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
    search_fields = ['title']
    
    def Product_Count(self,collection):
        return collection.Product_Count
    
    def get_queryset(self,request):
        return super().get_queryset(request).annotate(
            Product_Count=Count('product')
        )
    
# Register your models here.