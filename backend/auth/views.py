from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, CustomTokenObtainSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class LogoutView(APIView):
    permission_classes = []

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                # Blacklist the refresh token or handle it accordingly
                token = RefreshToken(refresh_token)
                token.blacklist()  # Ensure that the refresh token is invalidated
                return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainView(TokenObtainPairView):
    serializer_class = CustomTokenObtainSerializer
