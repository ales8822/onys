from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from .models import ChatRequest, ChatResponse
from .service import process_chat

router = APIRouter()

@router.post("/send")
async def send_chat_message(request: ChatRequest):
    try:
        return StreamingResponse(process_chat(request), media_type="application/x-ndjson")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))