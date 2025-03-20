from django.db import models

# Create your models here.
from django.db import models

class AIInteraction(models.Model):
    user_prompt = models.TextField()
    ai_response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Interaction on {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
