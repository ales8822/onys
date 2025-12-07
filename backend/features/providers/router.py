# backend/features/providers/router.py
import json
import os
from fastapi import APIRouter

router = APIRouter()
SETTINGS_FILE = "user_settings.json"

# Known models map (Static registry)
KNOWN_MODELS = {
    "openai": ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    "anthropic": ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"],
    "gemini": ["gemini-1.5-pro", "gemini-2.0-latest", "gemini-2.5-flash", "gemini-1.5-flash"],
    "grok": ["grok-beta"],
    "runpod": ["llama3-8b-instruct", "mistral-7b"] # Placeholder defaults
}

@router.get("/active")
def get_active_providers():
    if not os.path.exists(SETTINGS_FILE):
        return []

    with open(SETTINGS_FILE, "r") as f:
        data = json.load(f)

    active_list = []
    
    # Iterate through saved settings
    for provider in data.get("providers", []):
        # Check if provider is "active" (has keys or url)
        has_key = len(provider.get("keys", [])) > 0 and provider["keys"][0] != ""
        has_url = provider.get("url") and provider["url"] != ""

        if has_key or has_url:
            pid = provider["id"]
            # Get models from our registry, or use a default generic list
            models = KNOWN_MODELS.get(pid, ["default-model"])
            
            active_list.append({
                "id": pid,
                "name": provider["name"],
                "models": models
            })

    return active_list