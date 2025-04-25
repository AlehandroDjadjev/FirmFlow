from django.db import models
from llm_api.models import Document
# Create your models here.

class ResearchSession(Document):
    original_prompt = models.TextField() #saved original prompt
    topics = models.JSONField(default=dict) #topics with final text next to them - displayed only on special request
    urls = models.JSONField(null=True, blank=True) #output with main urls
    
    #text output - json is not use because we are working with large text that WILL be displayed (frontend)
    full_report = models.TextField(null=True, blank=True)
    cutdown_report = models.TextField(null=True, blank=True)
    summary_report = models.TextField(null=True, blank=True)

    #basic stuff
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
