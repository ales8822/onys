from pydantic import BaseModel
from typing import List, Optional

class ProviderSettings(BaseModel):
    id: str
    name: str
    keys: List[str] = [] # List of API keys
    url: Optional[str] = None # For RunPod/Ollama

class SettingsPayload(BaseModel):
    providers: List[ProviderSettings]