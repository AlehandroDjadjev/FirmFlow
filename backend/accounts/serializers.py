from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    social_links = serializers.CharField(required=False, allow_blank=True, allow_null=True)  # Allow blank or null value

    class Meta:
        model = UserProfile 
        fields = [
            "user",
            "bio",
            "phone_number",
            "social_links",
            "profile_picture",
            "first_name",
            "last_name",
            "email"
        ]

class CustomTokenObtainSerializer(TokenObtainPairSerializer):
    username_field = "username"  # Change to email-based login

    def validate(self, attrs):
        username = attrs.get("username")  # Input field "username" (email)
        password = attrs.get("password")

        # Get user by email instead of username
        try:
            user = User.objects.get(username=username)
            attrs["username"] = user.username  # Replace email with actual username
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError("Invalid username or password")

        return super().validate(attrs)

# serializers.py
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone_number']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        first_name=validated_data['first_name']
        last_name=validated_data['last_name']
        phone_number=validated_data['phone_number']
        UserProfile.objects.create(user=user, first_name=first_name, last_name=last_name, phone_number=phone_number)  # Create user profile
        return user
