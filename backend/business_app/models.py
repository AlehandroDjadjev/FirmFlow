from django.db import models
from django.contrib.auth.models import User

class Firm(models.Model):
    """Represents a business firm that can have multiple documents."""
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Document(models.Model):
    """Document model with firm-based unique numbering."""
    firm = models.ForeignKey(Firm, on_delete=models.CASCADE, related_name="documents")  # Link to a firm
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    document_number = models.PositiveIntegerField()  # Firm-specific ID
    title = models.CharField(max_length=255)
    text = models.TextField(blank=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("firm", "document_number")  # Ensures each firm has unique document numbers
        ordering = ["firm", "document_number"]

    def save(self, *args, **kwargs):
        """Assigns a unique document number per firm, starting from 1."""
        if not self.document_number:
            last_doc = Document.objects.filter(firm=self.firm).order_by("-document_number").first()
            self.document_number = last_doc.document_number + 1 if last_doc else 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.firm.name} - Document {self.document_number}: {self.title}"
