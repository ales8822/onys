import json
import os
import glob
from typing import List

SESSIONS_DIR = "data/sessions"

# Ensure directory exists
os.makedirs(SESSIONS_DIR, exist_ok=True)

def get_session_file(chat_id: str):
    # Sanitize ID to prevent path traversal
    safe_id = "".join([c for c in chat_id if c.isalnum() or c in "-_"])
    return os.path.join(SESSIONS_DIR, f"{safe_id}.json")

def save_session(chat_id: str, messages: List[dict]):
    file_path = get_session_file(chat_id)
    with open(file_path, "w") as f:
        json.dump(messages, f, indent=4)

def load_session(chat_id: str):
    file_path = get_session_file(chat_id)
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except:
        return []

def list_sessions():
    """Returns a list of available chat sessions based on file names"""
    files = glob.glob(os.path.join(SESSIONS_DIR, "*.json"))
    sessions = []
    for f in files:
        # Get filename without extension
        session_id = os.path.splitext(os.path.basename(f))[0]
        # Peek at the file to find a title (first user message) or use ID
        try:
            with open(f, "r") as json_file:
                data = json.load(json_file)
                # Find first user message for a title
                first_msg = next((m["content"] for m in data if m["role"] == "user"), "New Chat")
                title = first_msg[:30] + "..." if len(first_msg) > 30 else first_msg
        except:
            title = "Empty Chat"

        sessions.append({
            "id": session_id,
            "title": title
        })
    # Sort by modification time (newest first)
    sessions.sort(key=lambda x: os.path.getmtime(os.path.join(SESSIONS_DIR, f"{x['id']}.json")), reverse=True)
    return sessions