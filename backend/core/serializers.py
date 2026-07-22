from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer 
from .models import User


class UserCreateSerializer(BaseUserCreateSerializer):

    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']

