from fastapi import APIRouter, HTTPException
from .models import ChatRequest, ChatResponse
from .service import process_chat

router = APIRouter()

@router.post("/send", response_model=ChatResponse)
async def send_chat_message(request: ChatRequest):
    try:
        response_data = await process_chat(request)
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))