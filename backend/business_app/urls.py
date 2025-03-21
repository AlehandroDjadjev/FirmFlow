from django.urls import path
from .views import DocumentUploadView, DocumentDeleteView

urlpatterns = [
    path("upload/<int:firm_id>/", DocumentUploadView.as_view(), name="document-upload"),
    path("delete/<int:firm_id>/<int:document_number>/", DocumentDeleteView.as_view(), name="document-delete"),
]