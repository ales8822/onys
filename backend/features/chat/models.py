from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    role: str
    content: str
    # Flexible field to store metadata like tokens inside history
    meta: Optional[Dict[str, Any]] = None 

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
    agent_id: Optional[str] = None

class ChatResponse(BaseModel):
    content: str
    model: str
    provider: str
    usage: Optional[Dict[str, int]] = {} # New: { prompt_tokens, completion_tokens, total }

