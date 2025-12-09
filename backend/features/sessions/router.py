from fastapi import APIRouter
from typing import List
from .service import list_sessions, load_session, save_session
from pydantic import BaseModel

router = APIRouter()

class SessionSaveRequest(BaseModel):
    chat_id: str
    messages: List[dict]

@router.get("/")
def get_all_sessions():
    return list_sessions()

@router.get("/{chat_id}")
def get_session_history(chat_id: str):
    return load_session(chat_id)

@router.post("/save")
def save_session_endpoint(payload: SessionSaveRequest):
    save_session(payload.chat_id, payload.messages)
    return {"status": "success"}