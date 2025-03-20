import os
import json
import datetime
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from openai import OpenAI
from dotenv import load_dotenv
from pinecone import Pinecone
from typing import List, Tuple
from .models import AIResponse

# Load environment variables
load_dotenv()

# API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
EMBEDDING_MODEL = os.getenv("PINECONE_EMBEDDING_MODEL")
GPT_MODEL = os.getenv("GPT_MODEL")
NAMESPACE = os.getenv("NAMESPACE")

# Initialize OpenAI and Pinecone
openai_client = OpenAI(api_key=OPENAI_API_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

def get_system_prompt():
    """Read the system prompt from a file inside the backend folder."""
    file_path = os.path.join(settings.BASE_DIR, "prompts", "systemPrompt.txt")

    if not os.path.exists(file_path):
        return "System prompt file not found."

    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()

def get_recent_responses():
    """Retrieve the last 5 responses from the database to use as context."""
    recent_responses = AIResponse.objects.all().order_by("-created_at")[:5]
    if not recent_responses:
        return "No previous responses found."

    return "\n".join([f"User: {r.prompt}\nAI: {r.response}" for r in recent_responses])

def get_embedding(text: str) -> List[float]:
    """Generate embedding from OpenAI"""
    resp = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=[text]
    )
    return resp.data[0].embedding

def query_pinecone(query_text: str, top_k=3) -> List[Tuple[str, float]]:
    """Retrieve relevant chunks from Pinecone"""
    query_emb = get_embedding(query_text)
    result = index.query(
        vector=query_emb,
        top_k=top_k,
        include_metadata=True,
        namespace=NAMESPACE
    )

    matches = [(match.metadata["text"], match.score) for match in result.matches]
    return matches

def get_gpt_answer(query: str, retrieved_chunks: List[Tuple[str, float]]) -> str:
    """Get GPT response using retrieved context"""
    context_str = "\n".join([f"Chunk {i+1} (Score: {score:.2f}): {chunk}"
                             for i, (chunk, score) in enumerate(retrieved_chunks)])

    # Get system prompt and recent responses
    system_prompt = get_system_prompt()
    recent_responses = get_recent_responses()

    # Combine all context elements
    full_context = f"{system_prompt}\n\nRecent conversation:\n{recent_responses}\n\nRetrieved context:\n{context_str}"

    messages = [
        {"role": "system", "content": full_context},
        {"role": "user", "content": query}
    ]

    resp = openai_client.chat.completions.create(
        model=GPT_MODEL,
        messages=messages,
        temperature=0.1
    )
    return resp.choices[0].message.content

@csrf_exempt
def process_prompt(request):
    """Handle POST request to process a user prompt"""
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_query = data.get("prompt", "")

            if not user_query:
                return JsonResponse({"error": "No prompt provided"}, status=400)

            # Retrieve context from Pinecone
            retrieved = query_pinecone(user_query)

            # Generate AI response with context
            answer = get_gpt_answer(user_query, retrieved)

            # Save output to the database
            AIResponse.objects.create(prompt=user_query, response=answer)

            return JsonResponse({"response": answer})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)
