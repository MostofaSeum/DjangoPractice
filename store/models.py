from django.db import models

# Create your models here.
class Products(models.Model):
    title = models.CharField(max_length=255)
    slug = 