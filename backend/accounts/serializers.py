from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

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

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        UserProfile.objects.create(user=user)  # Create user profile
        return user
