from django.db import models
from django.contrib.auth.models import User

class Firm(models.Model):
    """Stores firm details"""
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class MainDocument(models.Model):
    """Stores the main PLAN document associated with a firm"""
    firm = models.OneToOneField(Firm, on_delete=models.CASCADE)
    text = models.TextField()

    def __str__(self):
        return f"Main Document for {self.firm.name}"

class AIInteraction(models.Model):
    """Stores user prompts & AI responses with firm association"""
    firm = models.ForeignKey(Firm, on_delete=models.CASCADE)
    user_prompt = models.TextField()
    ai_response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Interaction {self.id} for {self.firm.name}"

class Document(models.Model):
    """Stores saved AI-generated responses as documents"""
    firm = models.ForeignKey(Firm, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Document {self.id} - {self.title}"
