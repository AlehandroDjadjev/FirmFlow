
from django.urls import path
from .views import deep_search_view

urlpatterns = [
    path("research/", deep_search_view, name="deep-search"),
]
