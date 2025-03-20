from django.urls import path
from .views import DocumentListCreateView, DocumentRetrieveDeleteView

urlpatterns = [
    path('documents/', DocumentListCreateView.as_view(), name='document-list-create'),
    path('documents/<int:pk>/', DocumentRetrieveDeleteView.as_view(), name='document-retrieve-delete'),
]