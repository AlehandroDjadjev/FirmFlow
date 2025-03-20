from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'user', 'title', 'file', 'description', 'uploaded_at']

    def validate(self, data):
        """Ensure that both file and description are provided."""
        if not data.get('file'):
            raise serializers.ValidationError('A file must be uploaded.')
        if not data.get('description'):
            raise serializers.ValidationError('A description must be provided.')
        return data