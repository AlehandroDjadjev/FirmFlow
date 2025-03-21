from django.urls import path
from .views import (
    CreateFirmView, SubmitPromptView, DocumentUploadView, 
    DocumentDeleteView, ListFirmDocumentsView, ListFirmsView
)


urlpatterns = [
    path("firms/initialize/", CreateFirmView.as_view(), name="create_firm"),
    path("firms/list/<int:firm_id>/", ListFirmsView.as_view(), name="list_firms_view"),
    path("submit/<int:firm_id>/", SubmitPromptView.as_view(), name="submit_prompt"),
    path("documents/upload/<int:firm_id>/", DocumentUploadView.as_view(), name="upload_document"),
    path("documents/delete/<int:firm_id>/<int:document_number>/", DocumentDeleteView.as_view(), name="delete_document"),
    path("documents/list/<int:firm_id>/", ListFirmDocumentsView.as_view(), name="list_firm_documents_view"),
]
