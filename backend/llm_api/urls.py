from django.urls import path
from .views import (
    CreateFirmView, SubmitPromptView, AddNewDoc,
    DocumentDeleteView, ListFirmDocumentsView, ListFirmsView,
 UpdateFirmDocumentView, ListFirmInteractionsView, EditMainDocumentAIView, RAGUploadView,  GetFirm,
    GetMainDocumentView, EditDeleteFirmView ,EditDocumentView,GetSingleDocumentView,
)
# intiates a request with the llm, a firm id is included so the chat can be assosiated with a firm
# creates a firm and a main plan documents assosiated with it
# edits the main document of a firm
# lists all firms
# uploades an extra document
# deletes and extra document
# updates and extra document
# lists extra documents

urlpatterns = [
    path("submit/<int:firm_id>/", SubmitPromptView.as_view(), name="submit_prompt"),
    path("firms/initialize/", CreateFirmView.as_view(), name="create_firm"),
    path("interactions/<int:firm_id>/",
         ListFirmInteractionsView.as_view(), name="create_firm"),
    path("firms/<int:firm_id>/update-main-document/",
         EditMainDocumentAIView.as_view(), name="update_main_document"),
    path("firms/list/", ListFirmsView.as_view(), name="list_firms_view"),
    path('document/<int:firm_id>/<int:document_number>/', GetSingleDocumentView.as_view(), name='get_single_document'),
    path("documents/upload/<int:firm_id>/",
         AddNewDoc.as_view(), name="upload_document"),
    path("documents/delete/<int:firm_id>/<int:document_number>/", DocumentDeleteView.as_view(), name="delete_document"),
    path("documents/update/<int:firm_id>/<int:document_number>/", UpdateFirmDocumentView.as_view(), name="update_firm_document"),
    path('document/edit/<int:firm_id>/<int:document_number>/', EditDocumentView.as_view(), name='edit_document'),
    path("documents/list/<int:firm_id>/", ListFirmDocumentsView.as_view(),
         name="list_firm_documents_view"),
    path("rag/", RAGUploadView.as_view(),
        name="list_firm_documents_view"),
    #path("firms/location/", FirmCreateLocationView.as_view(), name="create-firm-with-location"),
    path("firm/<int:firm_id>/", GetFirm.as_view(), name="get_firm"),
    path("documents/main/<int:firm_id>/", GetMainDocumentView.as_view(), name="get_firm_document"),
    path("firm/edit/<int:firm_id>/", EditDeleteFirmView.as_view(), name="edit_delete_firm"),
]
