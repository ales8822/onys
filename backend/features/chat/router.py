from fastapi import APIRouter, HTTPException
from .models import ChatRequest, ChatResponse
from .service import process_chat

router = APIRouter()

@router.post("/send", response_model=ChatResponse)
async def send_chat_message(request: ChatRequest):
    try:
        response_content = await process_chat(request)
        
        return ChatResponse(
            content=response_content,
            model_used=request.model_id,
            provider=request.provider_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))