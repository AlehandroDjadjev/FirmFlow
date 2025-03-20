from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    username_field = "username"  # Change to email-based login

    def validate(self, attrs):
        username = attrs.get("username")  # Input field "username" (email)
        password = attrs.get("password")

        # Get user by email instead of username
        try:
            user = User.objects.get(username=username)
            attrs["username"] = user.username  # Replace email with actual username
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid username or password")

        return super().validate(attrs)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user