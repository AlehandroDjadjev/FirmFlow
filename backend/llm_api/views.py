from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from .models import Firm, MainDocument
from .serializers import FirmSerializer
from openai import OpenAI
import os
from .models import AIInteraction, Document
from .serializers import DocumentSerializer, AIInteractionSerializer
from pinecone import Pinecone
from dotenv import load_dotenv
from .model import query_pinecone

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
    chunks = [(match.metadata["text"], match.score)
              for match in result.matches]
    return chunks


def get_prompt_file(path):
    file_path = os.path.join(settings.BASE_DIR, "prompts", path)
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as file:
            return file.read()
    else:
        return Response({"error": "No planPrompt file"}, status=status.HTTP_400_BAD_REQUEST)
    

class CreateFirmView(generics.CreateAPIView):
    serializer_class = FirmSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # fields for firm creation, also edit models.py
        firm_name = request.data.get("name", "").strip()
        firm_budget = request.data.get("budget", "").strip()
        firm_future = request.data.get("future", "").strip()
        firm_notes = request.data.get("description", "").strip()
        firm_latitude = request.data.get("latitude", "")
        firm_longtitude = request.data.get("longtitude", "")
        firm_image = request.data.get("image", "").strip()

        if not all([firm_name,firm_latitude, firm_longtitude]):
            return Response({"error": "Firm name is required"}, status=status.HTTP_400_BAD_REQUEST)

        firm = Firm.objects.create(name=firm_name,description = firm_notes, latitude = firm_latitude, longtitude = firm_longtitude)

        # Create a single string for all fields
        content = (
            f"Name : {firm_name}\n"
            f"Firm Budget : {firm_budget}\n"
            f"Desired Firm Location : latitude: {firm_latitude} longtitude: {firm_longtitude}\n"
            f"Extra user descriptions / notes : {firm_notes}\n"
        )
        # big prompt
        messages = [
            {"role": "user",
             "content": f"Generate a business PLAN for a firm with these details:\n{content} using this template:{get_prompt_file('GeneratePlan.txt')}"}
        ]

        # model specifications
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.5
        )
        plan_text = response.choices[0].message.content.strip()

        main_document = MainDocument.objects.create(firm=firm, text=plan_text)
        main_document.save()
        firm.save()

        return Response({"firm_id": firm.id, "plan": plan_text}, status=status.HTTP_201_CREATED)


class SubmitPromptView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, firm_id):
        # fields. Prompt is required, save as document is for extra document creation, document id if including an extra document
        user_prompt = request.data.get("prompt", "").strip()
        save_as_document = request.data.get("save_as_document", False)
        document_id = request.data.get("document_id", None)

        if not user_prompt:
            return Response({"error": "Prompt cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)

        firm = get_object_or_404(Firm, id=firm_id)
        main_document_text = MainDocument.objects.filter(firm=firm_id)[0].text

        # extra document context - if id is included, include extra document for context
        document_context = ""
        if document_id:
            document = get_object_or_404(
                Document, firm=firm, document_number=document_id)
            document_context = f"\n\n### Additional Context from Document '{document.title}' ###\n{document.text}"

        # conversation history for last 10 interactions
        conversation_history = "\n".join([
            f"User: {i.user_prompt}\nAI: {i.ai_response}" for i in
            AIInteraction.objects.filter(
                firm=firm).order_by("-created_at")[:10]
        ])

        # chunk the dataset
        retrieved_chunks = query_dataset_chunks(user_prompt)
        context_from_chunks = "\n".join([
            f"--- Chunk {i+1} (score: {score:.2f}) ---\n{chunk}" for i, (chunk, score) in enumerate(retrieved_chunks)
        ])

        # full system prompt - normal sysPrompt file in prompts dir, dataset filtered info,
        # documents context, last 10 interactions, optional if creating a plan doc
        full_system_prompt = (
            f"{get_prompt_file('systemPrompt.txt')}\n\n"
            f"### Retrieved Dataset Context ###\n{context_from_chunks}\n\n"
            f"THIS IS THE MAIN DOCUMENT USE IT AT THE CORE OF YOUR USER RESPONSES:{main_document_text}THIS IS THE EXTRA DOCUMENT YOU SHOULD USE FOR CONTEXT:{document_context}\n\n"
            f"### Previous Interactions ###\n{conversation_history}\n\n"
            f"###THIS IS CONTEXTUAL INFORMATION FROM THE BULGARIAN FIRM CREATION LAWS CONNECTED WITH THE USER PROMPT WHICH YOU MUST USE TO GIVE ACCURATE DEPICTION OF THE COMPANY STARTUP PROCESS: {query_pinecone(user_prompt)}"
            f"{get_prompt_file('extradocPrompt') if save_as_document else ''}"
        )

        # user prompt included after chunked data about it
        messages = [
            {"role": "system", "content": full_system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # gpt model setup
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.5
        )

        ai_response = response.choices[0].message.content.strip()
        AIInteraction.objects.create(
            firm=firm, user_prompt=user_prompt, ai_response=ai_response)

        # saving if making a new document
        if save_as_document:
            document = Document.objects.create(
                firm=firm,
                title=f"AI Response for {firm.name}",
                text=ai_response
            )
            return Response({"response": ai_response, "document": document.document_number, "message": "Response saved as document."})

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
        document = get_object_or_404(
            Document, firm=firm_id, document_number=document_number, user=request.user)
        document.delete()
        return Response({"message": "Document deleted successfully!"}, status=status.HTTP_204_NO_CONTENT)


class ListFirmDocumentsView(generics.ListAPIView):
    """Lists all documents for a specific firm."""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        firm_id = self.kwargs.get("firm_id")
        firm = get_object_or_404(Firm, id=firm_id)
        return Document.objects.filter(firm=firm).order_by("document_number")

    def list(self, request, firm_id, *args, **kwargs):
        queryset = self.get_queryset()
        firm = get_object_or_404(Firm, id=firm_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "firm_id": firm.id,
            "firm_name": firm.name,
            "documents": serializer.data
        })


class ListFirmInteractionsView(generics.ListAPIView):
    """Lists all AI interactions for a specific firm."""
    serializer_class = AIInteractionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        firm_id = self.kwargs.get("firm_id")
        firm = get_object_or_404(Firm, id=firm_id)
        return AIInteraction.objects.filter(firm=firm).order_by("created_at")

    def list(self, request, firm_id, *args, **kwargs):
        queryset = self.get_queryset()
        firm = get_object_or_404(Firm, id=firm_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "firm_id": firm.id,
            "firm_name": firm.name,
            "interactions": serializer.data
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


class UpdateMainDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        new_text = request.data.get("main_document", "").strip()

        if not new_text:
            return Response({"error": "main_document content is required"}, status=status.HTTP_400_BAD_REQUEST)

        firm.main_document = new_text
        firm.save()
        return Response({"message": "Main document updated successfully.", "main_document": firm.main_document})


class UpdateFirmDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, firm_id, document_number):
        firm = get_object_or_404(Firm, id=firm_id)
        document = get_object_or_404(
            Document, firm=firm, document_number=document_number, user=request.user)

        new_title = request.data.get("title", None)
        new_text = request.data.get("text", None)

        if not new_title and not new_text:
            return Response({"error": "At least one of 'title' or 'text' is required."}, status=status.HTTP_400_BAD_REQUEST)

        if new_title:
            document.title = new_title
        if new_text:
            document.text = new_text

        document.save()
        return Response({
            "message": "Document updated successfully.",
            "document_number": document.document_number,
            "title": document.title,
            "text": document.text
        }, status=status.HTTP_200_OK)


class EditMainDocumentAIView(generics.CreateAPIView):
    """
    Incorporates selected pitch ideas into the firm's business plan.

    URL: /api/LLM/EditMain/<int:firm_id>/

    Expected JSON payload:
    {
        "selected_messages": [
            "User: ...",
            "AI: ...",
            "User: ...",
            ...
        ]
    }

    The view builds a system prompt using the current plan (if available) and the selected messages,
    sends it to OpenAI's chat completions endpoint, and then updates (or creates) the firm's MainDocument.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, firm_id):
        selected_messages = request.data.get("selected_messages", [])
        if not selected_messages:
            return Response({"error": "selected_messages cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the firm and its current main document (if any)
        firm = get_object_or_404(Firm, id=firm_id)
        main_document = MainDocument.objects.filter(firm=firm).first()
        current_plan = main_document.text if main_document else "No existing plan."

        # Construct the system prompt
        system_prompt = (
            "You are an expert business consultant. Below is the current business plan for the firm:\n\n"
            f"{current_plan}\n\n"
            "Incorporate the following pitch ideas into the business model to create an updated, improved plan. "
            "Your response must ONLY include the updated plan and nothing else."
        )
        pitch_text = "\n".join(selected_messages)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Update the plan using these pitch ideas:\n\n{pitch_text}"}
        ]

        try:
            response = openai_client.chat.completions.create(
                model=GPT_MODEL,
                messages=messages,
                temperature=0.1
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated_plan = response.choices[0].message.content.strip()

        # Save the updated plan into the firm's main document (update or create)
        if main_document:
            main_document.text = updated_plan
            main_document.save()
        else:
            MainDocument.objects.create(firm=firm, text=updated_plan)

        return Response({"updated_plan": updated_plan}, status=status.HTTP_200_OK)
