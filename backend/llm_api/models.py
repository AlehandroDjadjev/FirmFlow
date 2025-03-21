from django.db import models
from django.contrib.auth.models import User

class Firm(models.Model):
    """Stores firm details"""
    name = models.CharField(max_length=255, unique=True)
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
    """Firm-specific documents with numbering starting from 1"""
    firm = models.ForeignKey(Firm, on_delete=models.CASCADE, related_name="documents")  
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    document_number = models.PositiveIntegerField()  # Firm-specific numbering
    title = models.CharField(max_length=255)
    text = models.TextField(blank=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("firm", "document_number")  # Each firm has unique doc numbers
        ordering = ["firm", "document_number"]

    def save(self, *args, **kwargs):
        """Assigns a unique document number per firm, starting from 1."""
        if not self.document_number:
            last_doc = Document.objects.filter(firm=self.firm).order_by("-document_number").first()
            self.document_number = last_doc.document_number + 1 if last_doc else 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.firm.name} - Document {self.document_number}: {self.title}"
