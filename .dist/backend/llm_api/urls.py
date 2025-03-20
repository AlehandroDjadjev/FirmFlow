from django.urls import path
from .views import process_prompt

urlpatterns = [
    path("prompt/", process_prompt, name="process_prompt"),
]
