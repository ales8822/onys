from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    chat_id: str
    provider_id: str
    model_id: str
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    content: str
    model_used: str
    provider: str