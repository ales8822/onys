from pydantic import BaseModel
from typing import Optional
from uuid import UUID, uuid4

class Agent(BaseModel):
    id: str
    name: str
    role: str
    personality: str
    expertise: str
    category: str
    instructions: Optional[str] = ""
    knowledge: Optional[str] = ""

class AgentCreate(BaseModel):
    name: str
    role: str
    personality: str
    expertise: str
    category: str
    instructions: Optional[str] = ""
    knowledge: Optional[str] = ""

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    personality: Optional[str] = None
    expertise: Optional[str] = None
    category: Optional[str] = None
    instructions: Optional[str] = None
    knowledge: Optional[str] = None
