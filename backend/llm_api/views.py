from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from .models import Firm, MainDocument
from accounts.models import UserProfile
from accounts.serializers import UserProfileSerializer
from .serializers import FirmSerializer
from openai import OpenAI
import os
from .models import AIInteraction, Document
from .serializers import DocumentSerializer, AIInteractionSerializer
from pinecone import Pinecone
from dotenv import load_dotenv
from .model import query_pinecone, chunk_text,upsert_chunks
import requests
import requests
import time
import json
import PyPDF2
import urllib
import re

load_dotenv()  # this should run BEFORE os.getenv is called

# Headers


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

#extract txt from filepath of prompt
def get_prompt_file(path):
    file_path = os.path.join(settings.BASE_DIR, "prompts", path)
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as file:
            return file.read()
    else:
        return Response({"error": "No planPrompt file"}, status=status.HTTP_400_BAD_REQUEST)
    
class FirmListView(generics.ListAPIView):
    serializer_class = FirmSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retrieve all firms""" 
        print("User:", self.request.user)   
        return Firm.objects.all().order_by("-created_at")

    def list(self, request, *args, **kwargs):
        """Customize response format"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({"firms": serializer.data})
    
class UserProfileDetailView(generics.RetrieveAPIView):
    def get(self, request, firm_id):
        firma = Firm.objects.filter(id = firm_id)
        user = firma.first().user
        detailedUser = UserProfile.objects.filter(user = user).first()
        serializer = UserProfileSerializer(detailedUser, data=request.data, partial=True)
        if(serializer.is_valid()):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


#CRUD for firms
class EditDeleteFirmView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self, firm_id, user):
        return get_object_or_404(Firm, id=firm_id, user=user)

    def put(self, request, firm_id):
        firm = Firm.objects.filter(id = firm_id).first()
        serializer = FirmSerializer(firm, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, firm_id):
        firm = Firm.objects.filter(id = firm_id).first()
        firm.delete()
        return Response({"message": "Firm deleted successfully."}, status=status.HTTP_204_NO_CONTENT) 

#Intialize a firm by creating it and making a starting plan document
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
        firm_image = request.data.get("image", "").strip()

        if not all([firm_name]):
            return Response({"error": "Firm name is required"}, status=status.HTTP_400_BAD_REQUEST)

        firm = Firm.objects.create(name=firm_name,description = firm_notes, user = request.user)

        # Create a single string for all fields
        content = (
            f"Name : {firm_name}\n"
            f"Firm Budget : {firm_budget}\n"
            f"Extra user descriptions / notes : {firm_notes}\n"
        )
        # big prompt
        messages = [
            {"role": "user",
             "content": f"Answer in bulgarian. {get_prompt_file('GeneratePlan.txt')}. \n\n Firm details: {content}"}
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

#View for submitting prompts to llm
#View for submitting prompts to llm
class SubmitPromptView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, firm_id):
        # fields. Prompt is required, save as document is for extra document creation, document id if including an extra document
        user_prompt = request.data.get("prompt", "").strip()
        #save_as_document = request.data.get("save_as_document", False)
        document_id = request.data.get("document_id", None)
        raw_prompt = request.data.get("raw_prompt", "") # for research, input 'Y'for true. SCRAPED INFO IS SUBMITTED AS THE USER PROMPT

        pathPrompt = request.data.get("pathPrompt",None)#only for raw requests - sysprompt
        pathPrompt = pathPrompt.strip() if pathPrompt else None #safe strip

        GPTmodel = request.data.get("GPTmodel", "gpt-4") #only for raw requests
        GPTmodel = GPTmodel.strip() if GPTmodel else None

        if not user_prompt:
            return Response({"error": "Prompt cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
        
        firm = get_object_or_404(Firm, id=firm_id)

         # chunk the dataset
        retrieved_chunks = query_dataset_chunks(user_prompt)
        context_from_chunks = "\n".join([
            f"--- Chunk {i+1} (score: {score:.2f}) ---\n{chunk}" for i, (chunk, score) in enumerate(retrieved_chunks)
        ])
        
        if raw_prompt != "Y":
            main_document_text = MainDocument.objects.filter(firm=firm_id)[0].text

            # extra document context - if id is included, include extra document for context (not implemented)
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

           

            # full system prompt - normal sysPrompt file in prompts dir, dataset filtered info,
            # documents context, last 10 interactions, optional if creating a plan doc
            full_system_prompt = (
                f"Answer in bulgarian. {get_prompt_file('systemPrompt.txt')}\n\n"
                f"### Retrieved Dataset Context ###\n{context_from_chunks}\n\n"
                f"THIS IS THE MAIN DOCUMENT USE IT AT THE CORE OF YOUR USER RESPONSES:{main_document_text}THIS IS THE EXTRA DOCUMENT YOU SHOULD USE FOR CONTEXT:{document_context}\n\n"
                f"### Previous Interactions ###\n{conversation_history}\n\n"
                #f"{get_prompt_file('extradocPrompt') if save_as_document else ''}"
            )
        else:
         #put the all the scraped info as the user prompt
         full_system_prompt = (
             f"{pathPrompt}. The content for generating will be provided below:\n\n" #NO PATH USED WITH RAW PROMPTING FOR NOW 
             #PATH PROMPT IS NOT PATH = ACTUAL SYS PROMPT!!!!!!
         )
            
        # user prompt included after chunked data about it
        messages = [
            {"role": "system", "content": full_system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # gpt model setup
        response = openai_client.chat.completions.create(
            model=GPTmodel,
            messages=messages,
            temperature=0.5
        )

        ai_response = response.choices[0].message.content.strip()
        AIInteraction.objects.create(
            firm=firm, user_prompt=user_prompt, ai_response=ai_response)

        # saving if making a new document
        #if save_as_document:
        #    document = Document.objects.create(
        #        firm=firm,
        #       title=f"AI Response for {firm.name}",
        #        text=ai_response
        #    )
        #    return Response({"response": ai_response, "document": document.document_number, "message": "Response saved as document.","rag_context": context_from_chunks})

        return Response({"response": ai_response,"rag_context": context_from_chunks})


#edit documment (not implemented)
class EditDocumentView(APIView):
    """
    Edit a specific document's title or text.
    URL: /api/LLM/document/edit/<int:firm_id>/<int:document_number>/
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, firm_id, document_number):
        document = get_object_or_404(Document, firm__id=firm_id, document_number=document_number)
        serializer = DocumentSerializer(document, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Document updated successfully!",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


#delete doc
class DeleteDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, firm_id, document_number): 
        try:
            doc = Document.objects.get(firm__id=firm_id, document_number=document_number)
            doc.delete()
            return Response({"message": "Document deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)


#used to list all documents by title then select
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

class GetSingleDocumentView(APIView):
    """
    Retrieve a specific document by firm_id and document_number.
    URL: /api/LLM/document/<int:firm_id>/<int:document_number>/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, firm_id, document_number):
        document = get_object_or_404(Document, firm__id=firm_id, document_number=document_number)
        serializer = DocumentSerializer(document)
        return Response({
            "firm_id": firm_id,
            "document_number": document_number,
            "document": serializer.data
        }, status=status.HTTP_200_OK)


#list all interactions (prompt + responce) with a firm
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

#list all firms
class ListFirmsView(generics.ListAPIView):
    """Lists all firms"""
    serializer_class = FirmSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retrieve all firms"""
        return Firm.objects.filter(user=self.request.user).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        """Customize response format"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({"firms": serializer.data})

#edit main (plan) document
class EditMainDocumentAIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, firm_id):
        selected_messages = request.data.get("selected_messages", [])
        extra_msg = request.data.get("body","")
        # Retrieve the firm and its current main document (if any)
        firm = get_object_or_404(Firm, id=firm_id)
        main_document = MainDocument.objects.filter(firm=firm).first()
        current_plan = main_document.text if main_document else "No existing plan."

        # Construct the system prompt
        system_prompt = (
            f"Answer in bulgarian. You are an expert business consultant, text analyser and technical text writer. {get_prompt_file('updatePlan.txt')}\n\nOriginal plan:\n{current_plan}"
        )
        pitch_text = "\n".join(selected_messages)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Update the plan using these pitch ideas:\n\n{pitch_text}. \n\n Here is some DEFINITIVE user-provided info: {extra_msg}"}
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
    
#edit extra document
class EditExtranDocumentAIView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, firm_id, document_number):
        selected_messages = request.data.get("selected_messages", [])
        extra_msg         = request.data.get("body", "")

        firm      = get_object_or_404(Firm, id=firm_id)
        document  = Document.objects.filter(firm=firm,
                                            document_number=document_number
                                            ).first()           # ← .first()

        doc_text = document.text if document else "No existing plan."

        system_prompt = (
            f"Answer in bulgarian. You are an expert business consultant, "
            f"text analyser and technical text writer. "
            f"{get_prompt_file('updatePlan.txt')}\n\nOriginal plan:\n{doc_text}"
        )

        pitch_text = "\n".join(selected_messages)

        messages = [
            {"role": "system",
             "content": system_prompt},
            {"role": "user",
             "content": (
                 "Update the plan using these pitch ideas:\n\n"
                 f"{pitch_text}\n\n"
                 f"Here is some DEFINITIVE user-provided info: {extra_msg}"
             )}
        ]

        try:
            response = openai_client.chat.completions.create(
                model=GPT_MODEL,
                messages=messages,
                temperature=0.1
            )
        except Exception as e:
            return Response({"error": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        updated_plan = response.choices[0].message.content.strip()

        # save / create
        if document:
            document.text = updated_plan
            document.save()
        else:
            Document.objects.create(
                firm=firm,
                document_number=document_number,
                text=updated_plan
            )

        return Response({"updated_plan": updated_plan},
                        status=status.HTTP_200_OK)

    

#create a new document with user's selected messages
class AddNewDoc(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, firm_id):
        title = request.data.get("title","")
        body = request.data.get("body","")
        selected_messages = request.data.get("selected_messages", [])

        # Retrieve the firm
        firm = get_object_or_404(Firm, id=firm_id)

        # Construct the system prompt
        system_prompt = get_prompt_file("extradocPrompt.txt")

        if isinstance(system_prompt, Response):
          return system_prompt  # clean exit
    
        rendered = "\n".join(selected_messages)

        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                # simple f-string, no .format()
                "content": f"#CONTENT: {body}\n\n#MESSAGES\n{rendered}"
            },
        ]

        try:
            response = openai_client.chat.completions.create(
                model=GPT_MODEL,
                messages=messages,
                temperature=0.3
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        newDoc = response.choices[0].message.content.strip()


        base = title.strip()                    
        same_title = (
            Document.objects
                    .filter(
                        firm=firm,
                        title__regex=rf'^{re.escape(base)}\d*$' 
                    )
                    .count()
        )

        # Create the document with index in title
        document = Document.objects.create(
            firm=firm,
            title= title if not same_title else f"{title}-{same_title}",
            text=newDoc
        )

        return Response({"updated_plan": newDoc}, status=status.HTTP_200_OK)


#Update firm document 
class UpdateFirmDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, firm_id, document_number):
        firm = get_object_or_404(Firm, id=firm_id)
        document = get_object_or_404(
            Document, firm=firm, document_number=document_number)

        new_text = request.data.get("text", None)

        if not new_text:
            return Response({"error": "At least one of 'text' is required."}, status=status.HTTP_400_BAD_REQUEST)

        if new_text:
            document.text = new_text

        document.save()
        return Response({
            "message": "Document updated successfully.",
            "document_number": document.document_number,
            "title": document.title,
            "text": document.text
        }, status=status.HTTP_200_OK)
    

#Update firm document 
class UpdateMainDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        main_document = MainDocument.objects.filter(firm=firm).first()

        new_text = request.data.get("text", None)

        if not new_text:
            return Response({"error": "At least one of 'text' is required."}, status=status.HTTP_400_BAD_REQUEST)

        if new_text:
            main_document.text = new_text

        main_document.save()
        return Response({
            "message": "Document updated successfully.",
            "document_number": main_document,
            "title": main_document,
            "text": main_document.text
        }, status=status.HTTP_200_OK)

    
class GetFirm(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        serializer = FirmSerializer(firm)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    
#Upload to RAG
class RAGUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        text_input = request.data.get("rag_EXTRA", "").strip()
        url = request.data.get("url", "").strip()
        pdf_file = request.FILES.get("pdf_file")

        try:
            # 1. Handle PDF
            if pdf_file:
                reader = PyPDF2.PdfReader(pdf_file)
                text = ""
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted

            # 2. Handle URL
            elif url:
                text = ""
                try:
                    with urllib.request.urlopen(url, timeout=10) as response:
                        url_content = response.read().decode("utf-8", errors="ignore")
                        text += "\n\n[From URL]:\n" + url_content
                except Exception as e:
                    return Response(
                        {"error": "Failed to fetch URL content", "details": str(e)},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # 3. Handle raw text
            elif text_input:
                text = text_input

            else:
                return Response({
                    "error": "Provide either 'rag_EXTRA', 'url' or 'pdf_file'."
                }, status=status.HTTP_400_BAD_REQUEST)

            if not text.strip():
                return Response({
                    "error": "No valid text found to process."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Chunk and upsert to Pinecone
            chunks = chunk_text(text)
            timestamp = int(time.time())
            metadata_prefix = f"user-{user.id}-{timestamp}"
            upsert_chunks(chunks, metadata_prefix=metadata_prefix)

            return Response({
                "message": "Data successfully added to RAG.",
                "chunks_uploaded": len(chunks),
                "source_type": "pdf" if pdf_file else "url" if url else "text",
                "metadata_prefix": metadata_prefix
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                "error": "Failed to process and upload.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
class GetMainDocumentView(APIView):
    """
    Returns the main document for a firm.

    URL: /api/LLM/main_document/<int:firm_id>/
    Method: GET

    Response:
    {
        "firm_id": 1,
        "main_document": "This is the firm's business plan..."
    }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, firm_id):
        firm = get_object_or_404(Firm, id=firm_id)
        main_document = MainDocument.objects.filter(firm=firm).first()

        if not main_document:
            return Response({"error": "Main document not found for this firm."}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "firm_id": firm.id,
            "main_document": main_document.text
        }, status=status.HTTP_200_OK)