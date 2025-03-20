from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.exceptions import ValidationError

from .models import Document
from .serializers import DocumentSerializer

    
class DocumentUploadView(generics.CreateAPIView):
    queryset = Document.objects.all()  # The queryset is required for the `CreateAPIView`
    serializer_class = DocumentSerializer  # Use the DocumentSerializer for validation and creation
    permission_classes = [IsAuthenticated]  # Ensure the user is authenticated

    def perform_create(self, serializer):
        """Override the perform_create method to assign the user automatically."""
        serializer.save(user=self.request.user)  # Assign the current logged-in user to the document
