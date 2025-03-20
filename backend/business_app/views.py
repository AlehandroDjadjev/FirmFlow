from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.exceptions import ValidationError

from .serializers import DocumentSerializer, BusinessSerializer, InteractionSerializer


from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Document, Business, Interaction
from openai import OpenAI
from dotenv import load_dotenv
import os
import json
from django.conf import settings




class InitializeFirmView(generics.CreateAPIView):
    serializer_class = BusinessSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        load_dotenv()
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        initial_data = request.data

        prompt = (
            "You're a professional business analyst. Take the provided information and format it "
            "into a concise, clear, professional business plan.\n\n"
            f"Info:\n{json.dumps(initial_data, indent=2, ensure_ascii=False)}"
        )

        response = openai_client.chat.completions.create(
            model="gpt-4",  # or "gpt-3.5-turbo"
            messages=[{"role": "system", "content": prompt}],
            temperature=0.2,
            max_tokens=800
        )

        business_plan = response.choices[0].message.content.strip()

        firm_name = initial_data.get("name", "default_firm")
        filename = f"{firm_name.replace(' ', '_').lower()}_plan.txt"

        document = Document.objects.create(
            user=request.user,
            title=filename,
            text=business_plan
        )

        business = Business.objects.create(
            user=request.user,
            main_document=document
        )

        return Response({
            "business_plan": business_plan,
            "plan_filename": filename,
            "business_id": business.id
        }, status=status.HTTP_201_CREATED)


class ChatRespondView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        load_dotenv()
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        user_message = request.data

        business_id = user_message["business_id"]
        selected_document_name = user_message["selected_document"]

        business = get_object_or_404(Business, id=business_id, user=request.user)

        main_plan = business.main_document.text

        selected_document = get_object_or_404(Document, title=selected_document_name, user=request.user)

        last_5_messages = user_message["last_5_messages"]

        messages = [
            {"role": "system", "content": f"Main plan:\n{main_plan}\n\nSelected document:\n{selected_document.text}"},
            *last_5_messages,
            {"role": "user", "content": user_message["content"]}
        ]

        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.1
        )

        reply = response.choices[0].message.content.strip()

        response_document = Document.objects.create(
            user=request.user,
            title=f"Chat Response {business.extra_documents.count() + 1}",
            text=reply
        )
        business.extra_documents.add(response_document)

        return Response({"reply": reply}, status=status.HTTP_200_OK)

SYSTEM_PROMPT_PATH = os.path.join(settings.BASE_DIR, 'prompts', 'system_prompt.txt')
with open(SYSTEM_PROMPT_PATH, 'r', encoding='utf-8') as f:
    SYSTEM_PROMPT = f.read().strip()

class SubmitPromptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        load_dotenv()
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        user_message = request.data.get('message')
        if not user_message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch last 10 interactions for context
        interactions = Interaction.objects.filter(user=request.user).order_by('-created_at')[:10][::-1]

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for interaction in interactions:
            messages.append({"role": "user", "content": interaction.user_message})
            messages.append({"role": "assistant", "content": interaction.ai_response})

        messages.append({"role": "user", "content": user_message})

        # Call the LLM API
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.2,
            max_tokens=1000
        )

        ai_response = response.choices[0].message.content.strip()

        # Save the interaction
        interaction = Interaction.objects.create(
            user=request.user,
            user_message=user_message,
            ai_response=ai_response
        )

        serializer = InteractionSerializer(interaction)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InteractionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        interactions = Interaction.objects.filter(user=request.user).order_by('-created_at')
        serializer = InteractionSerializer(interactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    
class DocumentUploadView(generics.CreateAPIView):
    queryset = Document.objects.all()  # The queryset is required for the `CreateAPIView`
    serializer_class = DocumentSerializer  # Use the DocumentSerializer for validation and creation
    permission_classes = [IsAuthenticated]  # Ensure the user is authenticated

    def post(self, request):
        serializer = DocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Document submitted successfully!", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        """Override the perform_create method to assign the user automatically."""
        serializer.save(user=self.request.user)  # Assign the current logged-in user to the document
