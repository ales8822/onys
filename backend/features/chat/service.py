import httpx
import json
import os
from features.instructions.service import get_instruction
from features.sessions.service import save_session, save_session_meta, load_session_meta, get_session_file
from features.files.service import extract_text_from_file
from features.agents.service import get_agent

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

async def send_to_openai_compatible(key: str, model: str, messages: list, base_url: str, images: list = [], stream: bool = False):
    headers = { "Authorization": f"Bearer {key}", "Content-Type": "application/json" }
     # "Flashbulb" Strategy:
    # 1. Take history as text-only context.
    final_messages = messages.copy()
    # 2. Attach images ONLY to the last user message
    if images and final_messages:
        last_msg = final_messages.pop()
        content_list = [{"type": "text", "text": last_msg['content']}]
        for img_b64 in images:
            content_list.append({ "type": "image_url", "image_url": { "url": f"data:image/jpeg;base64,{img_b64}" } })
        final_messages.append({"role": "user", "content": content_list})

    payload = { "model": model, "messages": final_messages, "stream": stream }
    if stream:
        payload["stream_options"] = {"include_usage": True}
    async with httpx.AsyncClient() as client:
        if stream:
            async with client.stream("POST", base_url, headers=headers, json=payload, timeout=60.0) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    yield json.dumps({"error": f"HTTP {response.status_code}: {err_body.decode()}"})
                    return
                async for chunk in response.aiter_lines():
                    if chunk:
                        yield chunk
        else:
            yield await client.post(base_url, headers=headers, json=payload, timeout=60.0)

async def send_to_anthropic(key: str, model: str, messages: list, images: list = []):
    url = "https://api.anthropic.com/v1/messages"
    headers = { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" }

    system_prompt = None
    clean_messages = []
    for msg in messages:
        if msg['role'] == 'system':
            if system_prompt: system_prompt += "\n" + msg['content']
            else: system_prompt = msg['content']
        else:
            if isinstance(msg['content'], list):
                text_part = next((c['text'] for c in msg['content'] if c['type'] == 'text'), "")
                clean_messages.append({"role": msg['role'], "content": text_part})
            else:
                clean_messages.append(msg)

    if images and clean_messages:
        last_msg = clean_messages.pop()
        content_list = [{"type": "text", "text": last_msg['content']}]
        for img_b64 in images:
            content_list.append({ "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": img_b64 } })
        clean_messages.append({"role": "user", "content": content_list})

    payload = { "model": model, "messages": clean_messages, "max_tokens": 1024 }
    if system_prompt: payload["system"] = system_prompt

    async with httpx.AsyncClient() as client:
        return await client.post(url, headers=headers, json=payload, timeout=60.0)

async def send_to_gemini(key: str, model: str, messages: list, images: list = [], stream: bool = False):
    # Use streamGenerateContent for streaming, generateContent for non-streaming
    method = "streamGenerateContent" if stream else "generateContent"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:{method}?key={key}"
    if stream:
        url += "&alt=sse" # Request Server-Sent Events

    system_instruction = None
    contents = []

    for i, msg in enumerate(messages):
        if msg['role'] == 'system':
            text = msg['content']
            if system_instruction:
                system_instruction["parts"][0]["text"] += "\n" + text
            else:
                system_instruction = { "parts": [{ "text": text }] }
            continue

        role = "model" if msg['role'] == "assistant" else "user"
        parts = []
        if isinstance(msg['content'], list):
             text_part = next((c['text'] for c in msg['content'] if c['type'] == 'text'), "")
             parts.append({ "text": text_part })
        else:
             parts.append({ "text": msg['content'] })

        if i == len(messages) - 1 and images and role == "user":
            for img_b64 in images:
                parts.append({ "inline_data": { "mime_type": "image/jpeg", "data": img_b64 } })
        contents.append({ "role": role, "parts": parts })

    # Gemini requires at least one non-system message in 'contents'
    if not contents:
        contents.append({ "role": "user", "parts": [{ "text": "Begin response now." }] })

    payload = { "contents": contents }
    if system_instruction: payload["systemInstruction"] = system_instruction

    async with httpx.AsyncClient() as client:
        if stream:
            async with client.stream("POST", url, json=payload, timeout=60.0) as response:
                 if response.status_code != 200:
                    err_body = await response.aread()
                    yield json.dumps({"error": f"HTTP {response.status_code}: {err_body.decode()}"})
                    return
                 async for chunk in response.aiter_lines():
                    if chunk:
                        yield chunk
        else:
            yield await client.post(url, json=payload, timeout=60.0)

async def send_to_runpod(url: str, model: str, messages: list, stream: bool = False):
    clean_url = url.rstrip("/") + "/api/chat"
    payload = { "model": model, "messages": messages, "stream": stream }
    async with httpx.AsyncClient() as client:
        if stream:
            async with client.stream("POST", clean_url, json=payload, timeout=60.0) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    yield json.dumps({"error": f"HTTP {response.status_code}: {err_body.decode()}"})
                    return
                async for chunk in response.aiter_lines():
                    if chunk:
                        yield chunk
        else:
            yield await client.post(clean_url, json=payload, timeout=60.0)

# --- RECEIVERS (UPDATED TO RETURN TUPLE: content, usage) ---
def parse_openai_response(response):
    if response.status_code != 200:
        return f"Error {response.status_code}: {response.text}", {}
    
    data = response.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "No content.")
    
    # Extract Usage
    usage = data.get("usage", {})
    return content, {
        "prompt_tokens": usage.get("prompt_tokens", 0),
        "completion_tokens": usage.get("completion_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0)
    }

def parse_runpod_response(response):
    if response.status_code != 200:
        return f"Error {response.status_code}: {response.text}", {}
    
    data = response.json()
    content = data.get("message", {}).get("content", "No content.")
    
    # Ollama usage format
    return content, {
        "prompt_tokens": data.get("prompt_eval_count", 0),
        "completion_tokens": data.get("eval_count", 0),
        "total_tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0)
    }

def parse_anthropic_response(response):
    if response.status_code != 200:
        return f"Error {response.status_code}: {response.text}", {}
    
    data = response.json()
    content = ""
    if data.get("content"):
        content = data["content"][0].get("text", "")
        
    usage = data.get("usage", {})
    return content, {
        "prompt_tokens": usage.get("input_tokens", 0),
        "completion_tokens": usage.get("output_tokens", 0),
        "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0)
    }

def parse_gemini_response(response):
    if response.status_code != 200:
        return f"Error {response.status_code}: {response.text}", {}
    
    data = response.json()
    content = "No content."
    try:
        content = data["candidates"][0]["content"]["parts"][0]["text"]
    except:
        pass

    # Gemini Usage Metadata
    meta = data.get("usageMetadata", {})
    return content, {
        "prompt_tokens": meta.get("promptTokenCount", 0),
        "completion_tokens": meta.get("candidatesTokenCount", 0),
        "total_tokens": meta.get("totalTokenCount", 0)
    }

async def process_chat(request):
    config = get_provider_config(request.provider_id)
    if not config: 
        yield json.dumps({"error": "Provider configuration not found."})
        return

# 1. PREPARE & EXTRACT DOCUMENTS
    # If there are documents, extract text and append to the LAST user message
    docs_context = ""
    if request.documents:
        for doc in request.documents:
            text_content = extract_text_from_file(doc.name, doc.type, doc.content)
            docs_context += f"\n\n--- FILE: {doc.name} ---\n{text_content}\n-----------------------\n"

    # 2. INJECT INSTRUCTIONS
    user_instruction = get_instruction(request.chat_id)
    
    # AGENT INJECTION
    agent_instruction = ""
    if request.agent_id:
        agent = get_agent(request.agent_id)
        if agent:
            restrict_block = ""
            if agent.restrict_knowledge:
                restrict_block = """
            CRITICAL RESTRICTION: You must ONLY answer based on the knowledge provided above in YOUR KNOWLEDGE BASE.
            If the user asks something not covered by your knowledge base, politely respond that you don't have information on that topic.
            Do NOT use any external or general knowledge beyond what is explicitly provided above.
            """

            agent_instruction = f"""
            YOU ARE AN AI AGENT WITH THE FOLLOWING PROFILE:
            NAME: {agent.name}
            ROLE: {agent.role}
            PERSONALITY: {agent.personality}
            EXPERTISE: {agent.expertise}
            
            YOUR INSTRUCTIONS:
            {agent.instructions}
            
            YOUR KNOWLEDGE BASE:
            {agent.knowledge}
            {restrict_block}
            """

    custom_instruction = f"\n\nCURRENT TURN INSTRUCTION: {request.custom_prompt}" if request.custom_prompt else ""
    combined_system_prompt = f"{FORMATTING_INSTRUCTION}\n\n{agent_instruction}\n\n{user_instruction if user_instruction else ''}{custom_instruction}"

     # 3. CONSTRUCT MESSAGES
    final_messages = [m.model_dump() for m in request.messages]
    
    # If we extracted text from docs, append it to the latest user prompt
    if docs_context and final_messages:
        last_msg = final_messages[-1]
        if last_msg['role'] == 'user':
            # If content is a string, just append
            if isinstance(last_msg['content'], str):
                last_msg['content'] += f"\n\n[Attached Documentation]:{docs_context}"
            # If content is a list (multimodal structure), append a text block
            elif isinstance(last_msg['content'], list):
                last_msg['content'].append({"type": "text", "text": f"\n\n[Attached Documentation]:{docs_context}"})
    final_messages.insert(0, {"role": "system", "content": combined_system_prompt})
    # 4. PREPARE
    keys = config.get("keys", [])
    key = keys[0] if keys else ""
    url = config.get("url", "")
    pid = request.provider_id
    images = request.images if request.images else []
    
    answer_text = ""
    usage_data = {}
    
    try:
        stream_generator = None
        if pid == "runpod":
             stream_generator = send_to_runpod(url, request.model_id, final_messages, stream=True)

        elif pid == "openai":
            stream_generator = send_to_openai_compatible(key, request.model_id, final_messages, "https://api.openai.com/v1/chat/completions", images, stream=True)

        elif pid == "grok":
            stream_generator = send_to_openai_compatible(key, request.model_id, final_messages, "https://api.x.ai/v1/chat/completions", images, stream=True)

        elif pid == "gemini":
            stream_generator = send_to_gemini(key, request.model_id, final_messages, images, stream=True)

        else:
            # Fallback for non-streaming providers or unimplemented ones
            # For now we just return error for unimplemented streaming
            yield json.dumps({"error": f"Provider '{pid}' streaming not implemented yet."})
            return

        async for chunk in stream_generator:
            if not isinstance(chunk, str):
                continue
                
            # Handle both SSE ("data: { ... }") and raw JSON ("{ ... }")
            clean_chunk = chunk.strip()
            if clean_chunk.startswith("data: "):
                clean_chunk = clean_chunk[6:].strip()
                
            if not clean_chunk or clean_chunk == "[DONE]":
                continue

            try:
                data = json.loads(clean_chunk)
                
                # Check for explicit error field in chunk
                if "error" in data:
                    err_msg = data["error"]
                    if isinstance(err_msg, dict):
                        err_msg = err_msg.get("message", str(err_msg))
                    yield json.dumps({"error": str(err_msg)}) + "\n"
                    return

                delta = ""
                
                # OpenAI / Grok
                if "choices" in data:
                    delta = data["choices"][0]["delta"].get("content", "")
                
                # Ollama / RunPod
                elif "message" in data:
                        delta = data["message"].get("content", "")
                
                # Gemini (SSE format usually handled above, or raw)
                elif "candidates" in data:
                    parts = data["candidates"][0].get("content", {}).get("parts", [])
                    if parts:
                        delta = parts[0].get("text", "")
                
                if delta:
                    answer_text += delta
                    yield json.dumps({"chunk": delta}) + "\n"

                # Extract Usage
                if "usage" in data:
                    u = data["usage"]
                    usage_data = {
                        "prompt_tokens": u.get("prompt_tokens", 0),
                        "completion_tokens": u.get("completion_tokens", 0),
                        "total_tokens": u.get("total_tokens", 0)
                    }
                
                if "usageMetadata" in data:
                        u = data["usageMetadata"]
                        usage_data = {
                        "prompt_tokens": u.get("promptTokenCount", 0),
                        "completion_tokens": u.get("candidatesTokenCount", 0),
                        "total_tokens": u.get("totalTokenCount", 0)
                        }

            except Exception as e:
                # Log parsing error but don't crash the stream
                print(f"DEBUG: Failed to parse chunk: {clean_chunk} | Error: {e}")
                pass

    except Exception as e:
        yield json.dumps({"error": f"System Error: {str(e)}"})
        return

    # Send final usage data to frontend
    if usage_data:
        yield json.dumps({"usage": usage_data}) + "\n"

    # 4. SAVE SESSION WITH METADATA
    new_history = [m.model_dump() for m in request.messages]
    
    # We save the usage stats INSIDE the assistant message
    meta_data = usage_data.copy() if usage_data else {}
    meta_data["model"] = request.model_id
    meta_data["provider"] = request.provider_id
    if request.agent_id:
        meta_data["agent_id"] = request.agent_id
        agent = get_agent(request.agent_id)
        if agent:
            meta_data["agent_name"] = agent.name

    new_history.append({
        "role": "assistant", 
        "content": answer_text,
        "meta": meta_data 
    })
    
    save_session(request.chat_id, new_history)

    # If it's a debate session, save metadata for grouping and titling
    if request.chat_id.startswith("debate-"):
        existing_meta = load_session_meta(request.chat_id)
        existing_meta.update({
            "is_debate": True,
            "topic": request.custom_prompt.split('"')[1] if '"' in request.custom_prompt else "Agent Debate",
            "created_at": existing_meta.get("created_at", os.path.getmtime(get_session_file(request.chat_id)))
        })
        save_session_meta(request.chat_id, existing_meta)