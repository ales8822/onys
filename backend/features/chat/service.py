import httpx
import json
import os
from features.instructions.service import get_instruction
from features.sessions.service import save_session

SETTINGS_FILE = "user_settings.json"

FORMATTING_INSTRUCTION = """
SYSTEM FORMATTING RULES:
1. When presenting data, use Markdown Tables.
2. When quoting, use Markdown Blockquotes (> quote).
3. Use Bold (**text**) for key terms.
"""

def get_provider_config(provider_id: str):
    if not os.path.exists(SETTINGS_FILE):
        return None
    with open(SETTINGS_FILE, "r") as f:
        data = json.load(f)
    for p in data.get("providers", []):
        if p["id"] == provider_id:
            return p
    return None

# --- MULTIMODAL SENDERS ---

async def send_to_openai_compatible(key: str, model: str, messages: list, base_url: str, images: list = []):
    headers = { "Authorization": f"Bearer {key}", "Content-Type": "application/json" }
    
    # "Flashbulb" Strategy:
    # 1. Take history as text-only context.
    final_messages = messages.copy()
    
    # 2. Attach images ONLY to the last user message
    if images and final_messages:
        last_msg = final_messages.pop()
        content_list = [{"type": "text", "text": last_msg['content']}]
        
        for img_b64 in images:
            content_list.append({
                "type": "image_url",
                "image_url": { "url": f"data:image/jpeg;base64,{img_b64}" }
            })
        
        final_messages.append({"role": "user", "content": content_list})

    payload = { "model": model, "messages": final_messages }

    async with httpx.AsyncClient() as client:
        return await client.post(base_url, headers=headers, json=payload, timeout=60.0)

async def send_to_anthropic(key: str, model: str, messages: list, images: list = []):
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }

    system_prompt = None
    clean_messages = []
    
    for msg in messages:
        if msg['role'] == 'system':
            if system_prompt: system_prompt += "\n" + msg['content']
            else: system_prompt = msg['content']
        else:
            # Strip previous image payloads if any, keep text
            if isinstance(msg['content'], list):
                # If history had images, reduce to text for tokens
                text_part = next((c['text'] for c in msg['content'] if c['type'] == 'text'), "")
                clean_messages.append({"role": msg['role'], "content": text_part})
            else:
                clean_messages.append(msg)

    # Attach images to current turn
    if images and clean_messages:
        last_msg = clean_messages.pop()
        content_list = [{"type": "text", "text": last_msg['content']}]
        
        for img_b64 in images:
            content_list.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": img_b64
                }
            })
        clean_messages.append({"role": "user", "content": content_list})

    payload = { "model": model, "messages": clean_messages, "max_tokens": 1024 }
    if system_prompt: payload["system"] = system_prompt

    async with httpx.AsyncClient() as client:
        return await client.post(url, headers=headers, json=payload, timeout=60.0)

async def send_to_gemini(key: str, model: str, messages: list, images: list = []):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    
    system_instruction = None
    contents = []

    for i, msg in enumerate(messages):
        if msg['role'] == 'system':
            system_instruction = { "parts": [{ "text": msg['content'] }] }
            continue
        
        role = "model" if msg['role'] == "assistant" else "user"
        parts = []

        # Simplify history
        if isinstance(msg['content'], list):
             text_part = next((c['text'] for c in msg['content'] if c['type'] == 'text'), "")
             parts.append({ "text": text_part })
        else:
             parts.append({ "text": msg['content'] })

        # Attach images ONLY if it is the last message
        if i == len(messages) - 1 and images and role == "user":
            for img_b64 in images:
                parts.append({
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": img_b64
                    }
                })

        contents.append({ "role": role, "parts": parts })

    payload = { "contents": contents }
    if system_instruction: payload["systemInstruction"] = system_instruction

    async with httpx.AsyncClient() as client:
        return await client.post(url, json=payload, timeout=60.0)

# --- RECEIVERS (Keep existing) ---
def parse_openai_response(response) -> str:
    if response.status_code != 200: return f"Error {response.status_code}: {response.text}"
    return response.json().get("choices", [{}])[0].get("message", {}).get("content", "No content.")

def parse_runpod_response(response) -> str:
    if response.status_code != 200: return f"Error {response.status_code}: {response.text}"
    return response.json().get("message", {}).get("content", "No content.")

def parse_anthropic_response(response) -> str:
    if response.status_code != 200: return f"Error {response.status_code}: {response.text}"
    content_blocks = response.json().get("content", [])
    if content_blocks: return content_blocks[0].get("text", "")
    return "No content."

def parse_gemini_response(response) -> str:
    if response.status_code != 200: return f"Error {response.status_code}: {response.text}"
    try: return response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except: return "No content."

# --- MAIN ORCHESTRATOR ---

async def process_chat(request):
    config = get_provider_config(request.provider_id)
    if not config: return "Provider configuration not found."

    # 1. INJECT INSTRUCTIONS
    user_instruction = get_instruction(request.chat_id)
    combined_system_prompt = f"{FORMATTING_INSTRUCTION}\n\n{user_instruction if user_instruction else ''}"

    final_messages = [m.dict() for m in request.messages]
    final_messages.insert(0, {"role": "system", "content": combined_system_prompt})

    # 2. PREPARE
    keys = config.get("keys", [])
    key = keys[0] if keys else ""
    url = config.get("url", "")
    pid = request.provider_id
    images = request.images if request.images else []

    raw_response = None
    answer_text = ""
    
    try:
        if pid == "runpod":
             # RunPod vision implementation depends on specific model, defaulting to text-only for safety here
             # unless user specifically configured a LLaVA endpoint
             # Ideally you'd do: send_to_runpod(..., images)
             raw_response = await send_to_runpod(url, request.model_id, final_messages)
             answer_text = parse_runpod_response(raw_response)

        elif pid == "openai":
            raw_response = await send_to_openai_compatible(key, request.model_id, final_messages, "https://api.openai.com/v1/chat/completions", images)
            answer_text = parse_openai_response(raw_response)

        elif pid == "grok":
            raw_response = await send_to_openai_compatible(key, request.model_id, final_messages, "https://api.x.ai/v1/chat/completions", images)
            answer_text = parse_openai_response(raw_response)

        elif pid == "anthropic":
            raw_response = await send_to_anthropic(key, request.model_id, final_messages, images)
            answer_text = parse_anthropic_response(raw_response)
        
        elif pid == "gemini":
            raw_response = await send_to_gemini(key, request.model_id, final_messages, images)
            answer_text = parse_gemini_response(raw_response)

        else:
            return f"Provider '{pid}' not implemented."

    except Exception as e:
        return f"System Error: {str(e)}"

    # 4. SAVE SESSION
    # Save the text history. We do NOT save the image payload in the text history for token reasons.
    # The Frontend handles the image persistence locally for display.
    new_history = [m.dict() for m in request.messages]
    new_history.append({"role": "assistant", "content": answer_text})
    save_session(request.chat_id, new_history)

    return answer_text