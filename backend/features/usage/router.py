from fastapi import APIRouter
import json
import os
import glob

router = APIRouter(tags=["Usage"])

SESSIONS_DIR = "data/sessions"

@router.get("/stats")
def get_usage_stats():
    """Aggregate token usage across all chat sessions."""
    sessions_data = []
    total_prompt = 0
    total_completion = 0
    total_tokens = 0
    models_usage = {}  # key: "provider/model", value: {prompt, completion, total, count}

    all_files = glob.glob(os.path.join(SESSIONS_DIR, "*.json"))
    files = [f for f in all_files if not f.endswith(".meta.json")]

    for f in files:
        session_id = os.path.splitext(os.path.basename(f))[0]
        try:
            with open(f, "r") as json_file:
                messages = json.load(json_file)
        except:
            continue

        # Extract title from first user message
        first_msg = next((m["content"] for m in messages if m["role"] == "user"), "New Chat")
        title = first_msg[:40] + "..." if len(first_msg) > 40 else first_msg

        # Aggregate usage from assistant messages with meta
        session_prompt = 0
        session_completion = 0
        session_total = 0
        message_count = len(messages)

        for msg in messages:
            meta = msg.get("meta")
            if meta and msg.get("role") == "assistant":
                p = meta.get("prompt_tokens", 0)
                c = meta.get("completion_tokens", 0)
                t = meta.get("total_tokens", 0)
                session_prompt += p
                session_completion += c
                session_total += t

                # Per-model aggregation
                model_name = meta.get("model")
                provider_name = meta.get("provider")
                if model_name:
                    key = f"{provider_name}/{model_name}" if provider_name else model_name
                    if key not in models_usage:
                        models_usage[key] = {
                            "model": model_name,
                            "provider": provider_name or "unknown",
                            "prompt_tokens": 0,
                            "completion_tokens": 0,
                            "total_tokens": 0,
                            "message_count": 0
                        }
                    models_usage[key]["prompt_tokens"] += p
                    models_usage[key]["completion_tokens"] += c
                    models_usage[key]["total_tokens"] += t
                    models_usage[key]["message_count"] += 1

        total_prompt += session_prompt
        total_completion += session_completion
        total_tokens += session_total

        sessions_data.append({
            "id": session_id,
            "title": title,
            "message_count": message_count,
            "prompt_tokens": session_prompt,
            "completion_tokens": session_completion,
            "total_tokens": session_total,
            "modified": os.path.getmtime(f)
        })

    # Sort by most recently modified
    sessions_data.sort(key=lambda x: x["modified"], reverse=True)

    # Sort models by total tokens descending
    models_list = sorted(models_usage.values(), key=lambda x: x["total_tokens"], reverse=True)

    # Per-agent aggregation
    agents_usage = {}
    for f in files:
        try:
            with open(f, "r") as json_file:
                messages = json.load(json_file)
                for msg in messages:
                    meta = msg.get("meta")
                    if meta and msg.get("role") == "assistant" and meta.get("agent_id"):
                        a_id = meta["agent_id"]
                        a_name = meta.get("agent_name", "Unknown Agent")
                        if a_id not in agents_usage:
                            agents_usage[a_id] = {
                                "id": a_id,
                                "name": a_name,
                                "prompt_tokens": 0,
                                "completion_tokens": 0,
                                "total_tokens": 0
                            }
                        agents_usage[a_id]["prompt_tokens"] += meta.get("prompt_tokens", 0)
                        agents_usage[a_id]["completion_tokens"] += meta.get("completion_tokens", 0)
                        agents_usage[a_id]["total_tokens"] += meta.get("total_tokens", 0)
        except:
            continue
    
    agents_list = sorted(agents_usage.values(), key=lambda x: x["total_tokens"], reverse=True)

    return {
        "totals": {
            "prompt_tokens": total_prompt,
            "completion_tokens": total_completion,
            "total_tokens": total_tokens,
            "session_count": len(sessions_data)
        },
        "sessions": sessions_data,
        "models": models_list,
        "agents": agents_list
    }
