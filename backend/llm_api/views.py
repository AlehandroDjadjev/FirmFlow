import os
import json
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from openai import OpenAI
from dotenv import load_dotenv
from typing import List
from .models import AIInteraction

# Load environment variables
load_dotenv()

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GPT_MODEL = os.getenv("GPT_MODEL", "gpt-4")  # Default to GPT-4 if not set

# Initialize OpenAI
openai_client = OpenAI(api_key=OPENAI_API_KEY)

def get_system_prompt():
    """Read the system prompt from the 'prompts' folder in the root directory."""
    file_path = os.path.join(settings.BASE_DIR, "prompts", "systemPrompt.txt")

    if not os.path.exists(file_path):
        return "System prompt file not found."

    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()

def get_last_interactions(n=10):
    """Retrieve the last 10 AI interactions from the database for context."""
    recent_interactions = AIInteraction.objects.all().order_by("-created_at")[:n]
    
    if not recent_interactions:
        return "No previous interactions found."

    return "\n".join(
        [f"User: {interaction.user_prompt}\nAI: {interaction.ai_response}" for interaction in recent_interactions]
    )


@csrf_exempt
def submit_prompt(request):
    """Handles user prompt submission, interacts with OpenAI, and stores the response."""
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_prompt = data.get("prompt", "").strip()

            if not user_prompt:
                return JsonResponse({"error": "Prompt cannot be empty"}, status=400)

            # Retrieve system prompt and last 10 interactions
            system_prompt = get_system_prompt()
            conversation_history = get_last_interactions()

            # Construct the message for OpenAI
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "system", "content": conversation_history},
                {"role": "user", "content": user_prompt}
            ]

            response = openai_client.chat.completions.create(
                model=GPT_MODEL,
                messages=messages,
                temperature=0.1
            )

            ai_response = response.choices[0].message.content.strip()

            # Save to database
            AIInteraction.objects.create(user_prompt=user_prompt, ai_response=ai_response)

            return JsonResponse({"response": ai_response})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)

@csrf_exempt
def get_saved_interactions(request):
    """Retrieve the last 10 AI interactions from the database."""
    interactions = AIInteraction.objects.all().order_by("-created_at")[:10]

    response_data = [
        {
            "user_prompt": interaction.user_prompt,
            "ai_response": interaction.ai_response,
            "created_at": interaction.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for interaction in interactions
    ]

    return JsonResponse({"saved_interactions": response_data})
