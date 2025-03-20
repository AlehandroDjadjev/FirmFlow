from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import DocumentUploadView, InitializeFirmView, InteractionHistoryView, SubmitPromptView

urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('create-firm/', InitializeFirmView.as_view(), name='document-upload'),
    path('submit-prompt/', SubmitPromptView.as_view(), name='submit-prompt'),
    path('interactions/', InteractionHistoryView.as_view(), name='interaction-history'),
]