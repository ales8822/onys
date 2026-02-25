from fastapi import APIRouter
from typing import List
from .service import list_sessions, load_session, save_session, delete_session, branch_session, load_session_meta
from pydantic import BaseModel
import uuid

router = APIRouter()

class SessionSaveRequest(BaseModel):
    chat_id: str
    messages: List[dict]

class BranchRequest(BaseModel):
    parent_id: str
    message_index: int

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

@router.delete("/{chat_id}")
def delete_session_endpoint(chat_id: str):
    success = delete_session(chat_id)
    if success:
        return {"status": "deleted"}
    return {"status": "error", "message": "File not found"}

@router.delete("/")
def delete_all_sessions_endpoint():
    from .service import delete_all_sessions
    success = delete_all_sessions()
    return {"status": "success"}

@router.get("/{chat_id}/meta")
def get_session_meta_endpoint(chat_id: str):
    return load_session_meta(chat_id)

@router.post("/branch")
def branch_session_endpoint(payload: BranchRequest):
    new_id = f"session-branch-{str(uuid.uuid4())[:8]}"
    success = branch_session(payload.parent_id, payload.message_index, new_id)
    if success:
        return {"status": "success", "new_id": new_id}
    return {"status": "error", "message": "Failed to branch session"}