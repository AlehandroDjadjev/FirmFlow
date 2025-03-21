from rest_framework import serializers
from .models import Firm, MainDocument, AIInteraction, Document

class FirmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Firm
        fields = "__all__"

class MainDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MainDocument
        fields = "__all__"

class AIInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIInteraction
        fields = "__all__"

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = "__all__"
