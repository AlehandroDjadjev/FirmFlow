from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

# Create your models here.

class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/', null=True, blank=True)  # File upload
    description = models.TextField(null=True, blank=True)  # Text description
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def clean(self):
        """Ensure that either a file or a description is provided, but not both."""
        if not self.file and not self.description:
            raise ValidationError('You must provide either a file or a description.')
        if self.file and self.description:
            raise ValidationError('You cannot provide both a file and a description.')

    class Meta:
        verbose_name = "Document"
        verbose_name_plural = "Documents"
    
