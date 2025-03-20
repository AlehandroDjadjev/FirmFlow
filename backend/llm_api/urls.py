from django.urls import path
from .views import submit_prompt

urlpatterns = [
    path("submit/", submit_prompt, name="submit_prompt"),

]
