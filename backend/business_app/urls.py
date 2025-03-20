from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import DocumentUploadView

urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('documents/<int:document_id>/', DocumentUploadView.as_view(), name='document-delete'),  # For DELETE
]