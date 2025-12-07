import httpx
import json
import os

SETTINGS_FILE = "user_settings.json"

# --- HELPER: Load Config ---
def get_provider_config(provider_id: str):
    if not os.path.exists(SETTINGS_FILE):
        return None
    with open(SETTINGS_FILE, "r") as f:
        data = json.load(f)
    for p in data.get("providers", []):
        if p["id"] == provider_id:
            return p
    return None

# --- PART 1: SEND LOGIC (Prepare Request) ---
async def send_to_ollama(url: str, model: str, messages: list):
    """Specific logic to send to RunPod/Ollama"""
    # Fix URL
    clean_url = url.rstrip("/") + "/api/chat"
    
    payload = {
        "model": model,
        "messages": messages,
        "stream": False 
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(clean_url, json=payload, timeout=60.0)
            return response
        except Exception as e:
            raise Exception(f"Connection failed: {str(e)}")

async def send_to_openai(key: str, model: str, messages: list):
    """Specific logic to send to OpenAI"""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": messages
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload, timeout=60.0)
        return response

# --- PART 2: RECEIVE LOGIC (Parse Response) ---
def parse_ollama_response(response) -> str:
    if response.status_code != 200:
        return f"Error {response.status_code}: {response.text}"
    
    data = response.json()
    # Ollama returns .message.content
    return data.get("message", {}).get("content", "No content received.")

def parse_openai_response(response) -> str:
    if response.status_code != 200:
        return f"Error {response.status_code}: {response.text}"
    
    data = response.json()
    # OpenAI returns .choices[0].message.content
    choices = data.get("choices", [])
    if choices:
        return choices[0].get("message", {}).get("content", "")
    return "No content received."

# --- MAIN ORCHESTRATOR ---
async def process_chat(request):
    config = get_provider_config(request.provider_id)
    if not config:
        return "Provider configuration not found."

    # DISPATCHER
    raw_response = None
    answer_text = ""

    # 1. Dispatch Send
    if request.provider_id == "runpod":
        raw_response = await send_to_ollama(config.get("url"), request.model_id, [m.dict() for m in request.messages])
        # 2. Dispatch Receive
        answer_text = parse_ollama_response(raw_response)

    elif request.provider_id == "openai":
        # Get the first key
        keys = config.get("keys", [])
        key = keys[0] if keys else ""
        raw_response = await send_to_openai(key, request.model_id, [m.dict() for m in request.messages])
        answer_text = parse_openai_response(raw_response)

    else:
        return f"Provider '{request.provider_id}' logic not implemented yet."

    return answer_text

# --- MAIN ORCHESTRATOR ---
async def process_chat(request):
    config = get_provider_config(request.provider_id)
    if not config:
        return "Provider configuration not found."

    # DISPATCHER
    raw_response = None
    answer_text = ""

    # 1. Dispatch Send
    if request.provider_id == "runpod":
        # RunPod doesn't use keys, it uses the URL
        raw_response = await send_to_ollama(
            config.get("url"), 
            request.model_id, 
            [m.dict() for m in request.messages]
        )
        # 2. Dispatch Receive
        answer_text = parse_ollama_response(raw_response)

    elif request.provider_id == "openai":
        # Get the first key
        keys = config.get("keys", [])
        key = keys[0] if keys else ""
        
        raw_response = await send_to_openai(
            key, 
            request.model_id, 
            [m.dict() for m in request.messages]
        )
        answer_text = parse_openai_response(raw_response)

    else:
        return f"Provider '{request.provider_id}' logic not implemented yet."

    return answer_text