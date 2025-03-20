from django.db import models

# Create your models here.

class AIResponse(models.Model):
    prompt = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Response at {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"