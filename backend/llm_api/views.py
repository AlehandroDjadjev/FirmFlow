import os
import json
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from openai import OpenAI
from dotenv import load_dotenv
from typing import List
from .models import AIInteraction, Document
from django.shortcuts import get_object_or_404
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Firm, MainDocument, AIInteraction

# Load environment variables
load_dotenv()

# API Keys
OPENAI_API_KEY = "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"
GPT_MODEL = os.getenv("GPT_MODEL", "gpt-4")  # Default to GPT-4 if not set

# Initialize OpenAI
openai_client = OpenAI(
    api_key="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")


def get_system_prompt():
    """Read the system prompt from the 'prompts' folder in the root directory."""
    file_path = os.path.join(settings.BASE_DIR, "prompts", "systemPrompt.txt")

    if not os.path.exists(file_path):
        return "System prompt file not found."

    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()


def get_last_interactions(firm_id, n=10):
    """Retrieve the last 10 AI interactions from the database for context."""
    firm = get_object_or_404(Firm, id=firm_id)
    recent_interactions = AIInteraction.objects.filter(
        firm=firm).order_by("created_at")[:n]

    if not recent_interactions:
        return "No previous interactions found."

    return "\n".join(
        [f"User: {interaction.user_prompt}\nAI: {interaction.ai_response}" for interaction in recent_interactions]
    )


@csrf_exempt
def submit_prompt(request, firm_id):
    """Handles user prompt submission, interacts with OpenAI, and stores the response."""
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_prompt = data.get("prompt", "").strip()
            save_as_document = data.get("save_as_document", False)
            document_id = data.get("document_id", None)

            if not user_prompt:
                return JsonResponse({"error": "Prompt cannot be empty"}, status=400)

            # Retrieve the firm and its main document
            firm = get_object_or_404(Firm, id=firm_id)
            main_document = MainDocument.objects.filter(firm=firm).first()
            main_document_text = main_document.text if main_document else ""

            # Retrieve extra document if `document_id` is provided
            document_context = ""
            if document_id:
                document = get_object_or_404(Document, id=document_id)
                document_context = f"\n\n### Additional Context from Document '{document.title}' ###\n{document.text}"

            # Retrieve last 10 interactions
            conversation_history = get_last_interactions(firm_id=firm_id, n=10)

            # Merge system prompt, firm main document, additional document & conversation history
            full_system_prompt = (
                f"{main_document_text}{document_context}\n\n### Previous Interactions ###\n{conversation_history}"
            )
            print(full_system_prompt)

            # Construct the message for OpenAI
            messages = [
                {"role": "system", "content": full_system_prompt},
                {"role": "user", "content": user_prompt}
            ]

            response = openai_client.chat.completions.create(
                model=GPT_MODEL,
                messages=messages,
                temperature=0.1
            )

            ai_response = response.choices[0].message.content.strip()

            # Save interaction
            AIInteraction.objects.create(
                firm=firm, user_prompt=user_prompt, ai_response=ai_response)

            # Save response as a document if requested
            if save_as_document:
                document = Document.objects.create(
                    firm=firm,
                    title=f"AI Response for {firm.name}",
                    text=ai_response
                )
                return JsonResponse({"response": ai_response, "document_id": document.id, "message": "Response saved as document."})

            return JsonResponse({"response": ai_response})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def edit_main_document(request, firm_id):
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

    The view constructs a system prompt using the current plan (if available) and the selected messages,
    then sends the prompt to OpenAI's chat completion endpoint. The response (which should contain ONLY the
    updated plan) is then saved as the firm's new MainDocument.
    """
    try:
        data = json.loads(request.body)
        selected_messages = data.get("selected_messages", [])

        if not selected_messages:
            return Response({"error": "selected_messages cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the firm and its existing main document (if any)
        firm = get_object_or_404(Firm, id=firm_id)
        main_document = MainDocument.objects.filter(firm=firm).first()
        current_plan = main_document.text if main_document else "No existing plan."

        # Construct the system prompt for GPT
        system_prompt = (
            "You are an expert business consultant. Below is the current business plan for the firm:\n\n"
            f"{current_plan}\n\n"
            "Incorporate the following pitch ideas into the business model to create an updated, improved plan. "
            "Your response must ONLY include the updated plan and nothing else."
        )

        # Combine the selected messages into one string (each on a new line)
        pitch_text = "\n".join(selected_messages)

        # Build the messages for OpenAI
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Update the plan using these pitch ideas:\n\n{pitch_text}"}
        ]

        response = openai_client.chat.completions.create(
            model=GPT_MODEL,
            messages=messages,
            temperature=0.1
        )
        updated_plan = response.choices[0].message.content.strip()

        # Save the updated plan as the new main document (update or create)
        if main_document:
            main_document.text = updated_plan
            main_document.save()
        else:
            MainDocument.objects.create(firm=firm, text=updated_plan)

        return Response({"updated_plan": updated_plan}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def initialize_firm(request):
    """Creates a new firm and generates a PLAN document"""
    try:
        data = json.loads(request.body)
        firm_name = data.get("name", "").strip()
        firm_des = data.get("description", "").strip()
        firm_budget = data.get("budget", "").strip()
        firm_future = data.get("future", "").strip()

        if not firm_name:
            return Response({"error": "Firm name is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Create Firm
        firm = Firm.objects.create(name=firm_name)

        # Generate a PLAN for the firm
        file_path = os.path.join(
            settings.BASE_DIR, "prompts", "systemPrompt.txt")

        if not os.path.exists(file_path):
            return "System prompt file not found."

        with open(file_path, "r", encoding="utf-8") as f:
            system_prompt = f.read().strip()
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate a PLAN for the firm: {firm_name}. The user description for the firm: {firm_des}. The user budget: {firm_budget}. The user idea for the future: {firm_future}"}
        ]

        response = openai_client.chat.completions.create(
            model=GPT_MODEL,
            messages=messages,
            temperature=0.1
        )
        plan_text = response.choices[0].message.content.strip()

        # Store the PLAN in `MainDocuments`
        MainDocument.objects.create(firm=firm, text=plan_text)

        return Response({"firm_id": firm.id, "plan": plan_text}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_firms(request):
    """Returns all firms"""
    firms = Firm.objects.all().values("id", "name", "created_at")
    return Response({"firms": list(firms)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_full_chat_history(request, firm_id):
    """Retrieve the full chat history for a firm"""
    firm = get_object_or_404(Firm, id=firm_id)

    interactions = AIInteraction.objects.filter(
        firm=firm).order_by("created_at")

    response_data = {
        "firm_id": firm.id,
        "firm_name": firm.name,
        "chat_history": [
            {
                "user_prompt": interaction.user_prompt,
                "ai_response": interaction.ai_response,
                "created_at": interaction.created_at.strftime("%Y-%m-%d %H:%M:%S")
            }
            for interaction in interactions
        ]
    }

    return Response(response_data, status=status.HTTP_200_OK)
