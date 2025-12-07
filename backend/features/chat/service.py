import httpx
import json
import os
from features.instructions.service import get_instruction

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

# --- SEND LOGIC ---

async def send_to_runpod(url: str, model: str, messages: list):
    """RunPod / Ollama (Original)"""
    if not url:
        raise Exception("RunPod/Ollama URL is missing.")
    clean_url = url.rstrip("/") + "/api/chat"
    
    # RunPod usually handles 'system' role fine in messages
    payload = { "model": model, "messages": messages, "stream": False }
    
    async with httpx.AsyncClient() as client:
        return await client.post(clean_url, json=payload, timeout=60.0)

async def send_to_openai_compatible(key: str, model: str, messages: list, base_url: str):
    """Generic handler for OpenAI, Grok, and others sharing the format"""
    headers = { "Authorization": f"Bearer {key}", "Content-Type": "application/json" }
    payload = { "model": model, "messages": messages }

    async with httpx.AsyncClient() as client:
        return await client.post(base_url, headers=headers, json=payload, timeout=60.0)

async def send_to_anthropic(key: str, model: str, messages: list):
    """Anthropic (Claude) - Requires extracting system message"""
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }

    # Extract system message if present (Anthropic wants it top-level)
    system_prompt = None
    clean_messages = []
    
    for msg in messages:
        if msg['role'] == 'system':
            system_prompt = msg['content']
        else:
            clean_messages.append(msg)

    payload = {
        "model": model,
        "messages": clean_messages,
        "max_tokens": 1024
    }
    if system_prompt:
        payload["system"] = system_prompt

    async with httpx.AsyncClient() as client:
        return await client.post(url, headers=headers, json=payload, timeout=60.0)

async def send_to_gemini(key: str, model: str, messages: list):
    """Google Gemini - REST API structure is different"""
    # URL format: .../models/{model}:generateContent?key={key}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    
    # 1. Handle System Instruction
    system_instruction = None
    contents = []

    for msg in messages:
        if msg['role'] == 'system':
            system_instruction = { "parts": [{ "text": msg['content'] }] }
        else:
            # Map roles: 'assistant' -> 'model', 'user' -> 'user'
            role = "model" if msg['role'] == "assistant" else "user"
            contents.append({
                "role": role,
                "parts": [{ "text": msg['content'] }]
            })

    payload = { "contents": contents }
    if system_instruction:
        payload["systemInstruction"] = system_instruction

    async with httpx.AsyncClient() as client:
        return await client.post(url, json=payload, timeout=60.0)

# --- RECEIVE LOGIC ---

def parse_openai_response(response) -> str:
    if response.status_code != 200:
        return f"Error {response.status_code}: {response.text}"
    data = response.json()
    choices = data.get("choices", [])
    if choices:
        return choices[0].get("message", {}).get("content", "")
    return "No content."

def parse_runpod_response(response) -> str:
    if response.status_code != 200:
        return f"Error {response.status_code}: {response.text}"
    data = response.json()
    return data.get("message", {}).get("content", "No content.")

def parse_anthropic_response(response) -> str:
    if response.status_code != 200:
        return f"Error {response.status_code}: {response.text}"
    data = response.json()
    # Content is a list of blocks
    content_blocks = data.get("content", [])
    if content_blocks and len(content_blocks) > 0:
        return content_blocks[0].get("text", "")
    return "No content."

def parse_gemini_response(response) -> str:
    if response.status_code != 200:
        return f"Error {response.status_code}: {response.text}"
    data = response.json()
    # Path: candidates[0].content.parts[0].text
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return "No content."

# --- MAIN ORCHESTRATOR ---

async def process_chat(request):
    config = get_provider_config(request.provider_id)
    if not config:
        return "Provider configuration not found."

    # 0. INJECT INSTRUCTIONS
    system_instruction = get_instruction(request.chat_id)
    final_messages = [m.dict() for m in request.messages]
    
    if system_instruction:
        # We assume standard role:system for now, specific senders extract it if needed
        final_messages.insert(0, {"role": "system", "content": system_instruction})

    # 1. PREPARE KEYS/URL
    keys = config.get("keys", [])
    key = keys[0] if keys else ""
    url = config.get("url", "")
    pid = request.provider_id

    # 2. DISPATCHER
    raw_response = None
    
    try:
        if pid == "runpod":
            raw_response = await send_to_runpod(url, request.model_id, final_messages)
            return parse_runpod_response(raw_response)

        elif pid == "openai":
            raw_response = await send_to_openai_compatible(key, request.model_id, final_messages, "https://api.openai.com/v1/chat/completions")
            return parse_openai_response(raw_response)

        elif pid == "grok":
            # Grok is compatible with OpenAI structure
            raw_response = await send_to_openai_compatible(key, request.model_id, final_messages, "https://api.x.ai/v1/chat/completions")
            return parse_openai_response(raw_response)

        elif pid == "anthropic":
            raw_response = await send_to_anthropic(key, request.model_id, final_messages)
            return parse_anthropic_response(raw_response)
        
        elif pid == "gemini":
            raw_response = await send_to_gemini(key, request.model_id, final_messages)
            return parse_gemini_response(raw_response)

        else:
            return f"Provider '{pid}' not implemented."

    except Exception as e:
        return f"System Error: {str(e)}"