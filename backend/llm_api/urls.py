from django.urls import path
from .views import submit_prompt, get_saved_interactions

urlpatterns = [
    path("submit/", submit_prompt, name="submit_prompt"),
    path("interactions/", get_saved_interactions, name="get_saved_interactions"),
]
