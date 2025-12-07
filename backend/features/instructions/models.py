from pydantic import BaseModel

class InstructionPayload(BaseModel):
    chat_id: str
    content: str