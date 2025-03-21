from rest_framework import serializers

from .models import Document

from .models import Interaction
class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'user', 'title', 'description', 'uploaded_at']

