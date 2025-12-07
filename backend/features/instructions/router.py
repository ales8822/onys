from fastapi import APIRouter
from .models import InstructionPayload
from .service import save_instruction, get_instruction

router = APIRouter()

@router.post("/save")
def save_instructions_endpoint(payload: InstructionPayload):
    save_instruction(payload.chat_id, payload.content)
    return {"status": "success"}

@router.get("/{chat_id}")
def get_instructions_endpoint(chat_id: str):
    content = get_instruction(chat_id)
    return {"content": content}