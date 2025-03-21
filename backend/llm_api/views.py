from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from .models import Firm, MainDocument
from .serializers import FirmSerializer
from openai import OpenAI
import os
from .models import AIInteraction,Document
from .serializers import DocumentSerializer
from pinecone import Pinecone
from dotenv import load_dotenv
load_dotenv()  # this should run BEFORE os.getenv is called

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
EMBEDDING_MODEL = os.getenv("PINECONE_EMBEDDING_MODEL")
GPT_MODEL = os.getenv("GPT_MODEL")
NAMESPACE = os.getenv("NAMESPACE", "default")
TOP_K = 3

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

def get_embedding(text: str):
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=[text]
    )
    return response.data[0].embedding

def query_dataset_chunks(query: str):
    query_vector = get_embedding(query)
    result = index.query(
        vector=query_vector,
        top_k=TOP_K,
        include_metadata=True,
        namespace=NAMESPACE
    )
    chunks = [(match.metadata["text"], match.score) for match in result.matches]
    return chunks

class CreateFirmView(generics.CreateAPIView):
    serializer_class = FirmSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        firm_name = request.data.get("name", "").strip()

        if not firm_name:
            return Response({"error": "Firm name is required"}, status=status.HTTP_400_BAD_REQUEST)

        firm = Firm.objects.create(name=firm_name)

        file_path = os.path.join(settings.BASE_DIR, "prompts", "GeneratePlan.txt")
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as file:
                plan_prompt = file.read()
        else:
            return Response({"error": "No planPrompt file"}, status=status.HTTP_400_BAD_REQUEST)

        messages = [
            {"role": "user", "content": f"Generate a business PLAN for firm: {firm_name} using this template:{plan_prompt}"}
        ]

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.1
        )
        plan_text = response.choices[0].message.content.strip()

        firm.main_document = plan_text
        firm.save()

        return Response({"firm_id": firm.id, "plan": plan_text}, status=status.HTTP_201_CREATED)


class SubmitPromptView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, firm_id):
        user_prompt = request.data.get("prompt", "").strip()
        save_as_document = request.data.get("save_as_document", False)
        document_id = request.data.get("document_id", None)

        if not user_prompt:
            return Response({"error": "Prompt cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)

        firm = get_object_or_404(Firm, id=firm_id)
        main_document_text = firm.main_document or ""

        document_context = ""
        if document_id:
            document = get_object_or_404(Document, firm=firm, document_number=document_id)
            document_context = f"\n\n### Additional Context from Document '{document.title}' ###\n{document.text}"

        conversation_history = "\n".join([
            f"User: {i.user_prompt}\nAI: {i.ai_response}" for i in
            AIInteraction.objects.filter(firm=firm).order_by("-created_at")[:10]
        ])

        retrieved_chunks = query_dataset_chunks(user_prompt)
        context_from_chunks = "\n".join([
            f"--- Chunk {i+1} (score: {score:.2f}) ---\n{chunk}" for i, (chunk, score) in enumerate(retrieved_chunks)
        ])


        file_path = os.path.join(settings.BASE_DIR, "prompts", "systemPrompt.txt")
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as file:
                sys_message = file.read()
        else:
            return Response({"error": "No systemPrompt file"}, status=status.HTTP_400_BAD_REQUEST)

        full_system_prompt = (
            f"{sys_message}\n\n"
            f"### Retrieved Dataset Context ###\n{context_from_chunks}\n\n"
            f"{main_document_text}{document_context}\n\n"
            f"### Previous Interactions ###\n{conversation_history}"
        )


        messages = [
            {"role": "system", "content": full_system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.1
        )

        ai_response = response.choices[0].message.content.strip()
        AIInteraction.objects.create(firm=firm, user_prompt=user_prompt, ai_response=ai_response)

        if save_as_document:
            document = Document.objects.create(
                firm=firm,
                user=request.user,
                title=f"AI Response for {firm.name}",
                text=ai_response
            )
            return Response({"response": ai_response, "document_id": document.document_number, "message": "Response saved as document."})

        return Response({"response": ai_response})
    


class DocumentUploadView(generics.CreateAPIView):
    """Upload a document to a firm."""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        serializer = DocumentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user, firm=firm)
            return Response({"message": "Document created successfully!", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DocumentDeleteView(generics.DestroyAPIView):
    """Delete a document by firm_id and document_number."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, firm_id, document_number):
        document = get_object_or_404(Document, firm=firm_id, document_number=document_number, user=request.user)
        document.delete()
        return Response({"message": "Document deleted successfully!"}, status=status.HTTP_204_NO_CONTENT)

class ListFirmDocumentsView(generics.ListAPIView):
    """Lists all documents for a specific firm."""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retrieve documents for the specified firm_id"""
        firm_id = self.kwargs.get("firm_id")  # Get the firm_id from URL
        firm = get_object_or_404(Firm, id=firm_id)  # Ensure firm exists
        return Document.objects.filter(firm=firm).order_by("document_number")

    def list(self, request, *args, **kwargs):
        """Customize response to include firm details"""
        queryset = self.get_queryset()
        firm = get_object_or_404(Firm, id=self.kwargs.get("firm_id"))

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "firm_id": firm.id,
            "firm_name": firm.name,
            "documents": serializer.data
        })
    
class ListFirmsView(generics.ListAPIView):
    """Lists all firms"""
    serializer_class = FirmSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retrieve all firms"""
        return Firm.objects.all().order_by("-created_at")

    def list(self, request, *args, **kwargs):
        """Customize response format"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({"firms": serializer.data})