import json
import os

DB_FILE = "chat_instructions.json"

def save_instruction(chat_id: str, content: str):
    data = _load_db()
    data[chat_id] = content
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

def get_instruction(chat_id: str) -> str:
    data = _load_db()
    return data.get(chat_id, "")

def _load_db():
    if not os.path.exists(DB_FILE):
        return {}
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except:
        return {}