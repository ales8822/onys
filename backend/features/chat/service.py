import httpx
import json
import os
from features.instructions.service import get_instruction
from features.sessions.service import save_session

SETTINGS_FILE = "user_settings.json"

# Force the AI to format responses correctly
FORMATTING_INSTRUCTION = """
SYSTEM FORMATTING RULES:
1. When presenting data, use Markdown Tables. Do NOT wrap tables in code blocks (```).
2. When quoting, use Markdown Blockquotes (> quote).
3. Use Bold (**text**) for key terms.
"""

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
    """Anthropic (Claude)"""
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }

    # Extract system message
    system_prompt = None
    clean_messages = []
    
    for msg in messages:
        if msg['role'] == 'system':
            # Combine multiple system msgs if needed
            if system_prompt:
                system_prompt += "\n" + msg['content']
            else:
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
    """Google Gemini"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    
    system_instruction = None
    contents = []

    for msg in messages:
        if msg['role'] == 'system':
            system_instruction = { "parts": [{ "text": msg['content'] }] }
        else:
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
    content_blocks = data.get("content", [])
    if content_blocks and len(content_blocks) > 0:
        return content_blocks[0].get("text", "")
    return "No content."

def parse_gemini_response(response) -> str:
    if response.status_code != 200:
        return f"Error {response.status_code}: {response.text}"
    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return "No content."

# --- MAIN ORCHESTRATOR ---

async def process_chat(request):
    config = get_provider_config(request.provider_id)
    if not config:
        return "Provider configuration not found."

    # 1. INJECT INSTRUCTIONS (User defined + Formatting Rules)
    user_instruction = get_instruction(request.chat_id)
    combined_system_prompt = f"{FORMATTING_INSTRUCTION}\n\n{user_instruction if user_instruction else ''}"

    # We make a copy of messages to send to the AI
    final_messages = [m.dict() for m in request.messages]
    
    # Insert system prompt at the top
    final_messages.insert(0, {"role": "system", "content": combined_system_prompt})

    # 2. PREPARE KEYS/URL
    keys = config.get("keys", [])
    key = keys[0] if keys else ""
    url = config.get("url", "")
    pid = request.provider_id

    # 3. DISPATCHER
    raw_response = None
    answer_text = ""  # We store the result here instead of returning immediately
    
    try:
        if pid == "runpod":
            raw_response = await send_to_runpod(url, request.model_id, final_messages)
            answer_text = parse_runpod_response(raw_response)

        elif pid == "openai":
            raw_response = await send_to_openai_compatible(key, request.model_id, final_messages, "https://api.openai.com/v1/chat/completions")
            answer_text = parse_openai_response(raw_response)

        elif pid == "grok":
            raw_response = await send_to_openai_compatible(key, request.model_id, final_messages, "https://api.x.ai/v1/chat/completions")
            answer_text = parse_openai_response(raw_response)

        elif pid == "anthropic":
            raw_response = await send_to_anthropic(key, request.model_id, final_messages)
            answer_text = parse_anthropic_response(raw_response)
        
        elif pid == "gemini":
            raw_response = await send_to_gemini(key, request.model_id, final_messages)
            answer_text = parse_gemini_response(raw_response)

        else:
            return f"Provider '{pid}' not implemented."

    except Exception as e:
        return f"System Error: {str(e)}"

    # 4. AUTO-SAVE SESSION (Medium-Term Memory)
    # We reconstruct the 'real' history (User Request + AI Answer)
    # Note: request.messages already contains the history UP TO the current user question.
    # We just append the new answer.
    
    new_history = [m.dict() for m in request.messages]
    new_history.append({"role": "assistant", "content": answer_text})
    
    # Save to disk
    save_session(request.chat_id, new_history)

    return answer_text