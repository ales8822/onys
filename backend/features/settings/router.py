# backend/features/settings/router.py
import json
from fastapi import APIRouter
from .models import SettingsPayload

router = APIRouter()
DB_FILE = "user_settings.json"

@router.post("/save")
def save_settings(payload: SettingsPayload):
    # Save the data to a local JSON file
    with open(DB_FILE, "w") as f:
        json.dump(payload.dict(), f, indent=4)
    return {"status": "success", "message": "Settings saved successfully"}

@router.get("/")
def get_settings():
    # Load settings if they exist
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"providers": []}