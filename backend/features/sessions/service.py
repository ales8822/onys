import json
import os
import glob
from typing import List

SESSIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/sessions"))

# Ensure directory exists
os.makedirs(SESSIONS_DIR, exist_ok=True)

def get_session_file(chat_id: str):
    # Sanitize ID to prevent path traversal
    safe_id = "".join([c for c in chat_id if c.isalnum() or c in "-_"])
    return os.path.join(SESSIONS_DIR, f"{safe_id}.json")

def get_session_meta_file(chat_id: str):
    safe_id = "".join([c for c in chat_id if c.isalnum() or c in "-_"])
    return os.path.join(SESSIONS_DIR, f"{safe_id}.meta.json")

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

def save_session_meta(chat_id: str, meta: dict):
    file_path = get_session_meta_file(chat_id)
    with open(file_path, "w") as f:
        json.dump(meta, f, indent=4)

def load_session_meta(chat_id: str):
    file_path = get_session_meta_file(chat_id)
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except:
        return {}

def list_sessions():
    """Returns a list of available chat sessions based on file names, excluding meta files"""
    # Use glob to find only .json files that DON'T end in .meta.json
    all_files = glob.glob(os.path.join(SESSIONS_DIR, "*.json"))
    files = [f for f in all_files if not f.endswith(".meta.json")]
    sessions = []
    for f in files:
        # Get filename without extension
        session_id = os.path.splitext(os.path.basename(f))[0]
        # Peek at the file to find a title (first user message) or use ID
        try:
            with open(f, "r") as json_file:
                data = json.load(json_file)
                # Find first user message for a title
                first_msg = next((m["content"] for m in data if m["role"] == "user"), None)
                
                meta = load_session_meta(session_id)
                # If it's a debate, use the topic as title
                if meta.get("is_debate") and meta.get("topic"):
                    title = f"Debate: {meta['topic']}"
                elif first_msg is None and not meta.get("parent_id"):
                    # Only skip if it's not a branch (branches might have content from parent)
                    # Actually, if there's NO content at all (empty list), skip it.
                    if not data:
                        continue
                    title = "New Chat"
                else:
                    title = (first_msg[:30] + "...") if first_msg and len(first_msg) > 30 else (first_msg or "New Chat")
        except:
            continue # Skip corrupted files entirely

        sessions.append({
            "id": session_id,
            "title": title,
            "meta": meta
        })
    # Sort by modification time (newest first)
    sessions.sort(key=lambda x: os.path.getmtime(os.path.join(SESSIONS_DIR, f"{x['id']}.json")), reverse=True)
    return sessions

def branch_session(parent_id: str, message_index: int, new_chat_id: str):
    messages = load_session(parent_id)
    if not messages:
        return False
    
    # Slice the messages up to the index (inclusive)
    # If index is 2, we take 0, 1, 2
    branched_messages = messages[:message_index + 1]
    
    # Save the new session
    save_session(new_chat_id, branched_messages)
    
    # Get parent title for metadata
    parent_messages = load_session(parent_id)
    parent_first_msg = next((m["content"] for m in parent_messages if m["role"] == "user"), "Original")
    parent_title = parent_first_msg[:30] + "..." if len(parent_first_msg) > 30 else parent_first_msg

    # Save metadata
    meta = {
        "parent_id": parent_id,
        "parent_title": parent_title,
        "branch_at": message_index,
        "created_at": os.path.getmtime(get_session_file(new_chat_id))
    }
    save_session_meta(new_chat_id, meta)
    
    return True

def delete_session(chat_id: str):
    file_path = get_session_file(chat_id)
    meta_path = get_session_meta_file(chat_id)
    
    # Simple deletion: just delete the file and meta.
    deleted = False
    if os.path.exists(file_path):
        os.remove(file_path)
        deleted = True
    if os.path.exists(meta_path):
        os.remove(meta_path)
    return deleted

def delete_all_sessions():
    """Wipes all session and metadata files"""
    files = glob.glob(os.path.join(SESSIONS_DIR, "*.json"))
    for f in files:
        try:
            os.remove(f)
        except:
            pass
    return True