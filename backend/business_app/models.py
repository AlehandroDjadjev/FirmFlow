from django.db import models

# Create your models here.

class Document(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')  # Files stored in MEDIA_ROOT/documents/
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Business(models.Model):
    description = models.TextField()
    
