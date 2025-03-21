from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Document, Firm
from .serializers import DocumentSerializer

class DocumentUploadView(generics.CreateAPIView):
    """Handles document creation."""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, firm_id):
        """Create a new document linked to a firm."""
        firm = get_object_or_404(Firm, id=firm_id)  # Ensure firm exists
        serializer = DocumentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user, firm=firm)
            return Response(
                {"message": "Document created successfully!", "data": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DocumentDeleteView(generics.DestroyAPIView):
    """Delete a document using firm_id and document_number."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, firm_id, document_number):
        document = get_object_or_404(Document, firm__id=firm_id, document_number=document_number, user=request.user)
        document.delete()
        return Response({"message": "Document deleted successfully!"}, status=status.HTTP_204_NO_CONTENT)
