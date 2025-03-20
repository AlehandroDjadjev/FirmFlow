from django.urls import path
from .views import initialize_firm, submit_prompt, list_firms,get_full_chat_history

urlpatterns = [
    # Firm Management
    path('initialize_firm/', initialize_firm, name='initialize_firm'),
    path('firms/', list_firms, name='list_firms'),

    # Prompt Submission
    path('submit/<int:firm_id>/', submit_prompt, name='submit_prompt'),

    # AI Interaction History
    path('interactions/<int:firm_id>/', get_full_chat_history, name='get_firm_interactions'),

    # Document Management
    #path('documents/<int:firm_id>/', get_document_list, name='get_document_list'),
    #path('document/<int:document_id>/', get_document, name='get_document'),
    #path('delete_document/<int:document_id>/', delete_document, name='delete_document'),
]
