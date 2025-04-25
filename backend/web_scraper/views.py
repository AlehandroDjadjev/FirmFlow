# views.py
import json
import threading

from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

# DeepSearch.py is in the *same* package as this views.py
from .DeepSearch import DeepSearch


@csrf_exempt               # skip CSRF for API‑only use; 
@require_POST
def deep_search_view(request):
    """
    POST JSON:
    {
        "input": "Започване на бизнес …",
        "firm_id": 1,
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5..."
    }
    """
    try:
        payload = json.loads(request.body.decode())
        prompt        = payload["input"]          # original user prompt
        firm_id       = int(payload["firm_id"])   # numeric firm id
        access_token  = payload["access_token"]   # JWT used inside DeepSearch
    except (KeyError, ValueError, json.JSONDecodeError) as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    DeepSearch(prompt, firm_id, access_token)
    return HttpResponse(status=201)  