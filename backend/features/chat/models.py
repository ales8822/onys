from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class FileAttachment(BaseModel):
    name: str
    type: str # e.g. "application/pdf" or "text/plain"
    content: str # Base64 string
    
class ChatRequest(BaseModel):
    chat_id: str
    provider_id: str
    model_id: str
    messages: List[ChatMessage]
    images: Optional[List[str]] = [] 
    documents: Optional[List[FileAttachment]] = []

class ChatResponse(BaseModel):
    content: str
    model_used: str
    provider: str

