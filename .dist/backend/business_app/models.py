from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

# Create your models here.

class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    text = models.TextField(blank=False)  # Text description
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Document"
        verbose_name_plural = "Documents"


class Business(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='businesses')  # Direct relationship to User
    main_document = models.ForeignKey(Document, related_name='main_for_businesses', on_delete=models.SET_NULL, null=True, blank=True)
    extra_documents = models.ManyToManyField(Document, related_name='businesses')  # Linking documents

    def __str__(self):
        return f"Business for {self.user.username} - ID: {self.id}"

    class Meta:
        verbose_name = "Business"
        verbose_name_plural = "Businesses"



    
