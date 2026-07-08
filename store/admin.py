from django.contrib.admin import register
from django.contrib import admin
from . import models

@admin.register(models.Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['title', 'unit_price']
 
    
# Register your models here.
admin.site.register(models.Collection)