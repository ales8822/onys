from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
from .models import Agent, AgentCreate, AgentUpdate
from .service import (
    create_agent, get_all_agents, get_agent, 
    update_agent, delete_agent, get_all_categories
)
import io
import pypdf
from PIL import Image
import pytesseract

router = APIRouter(tags=["agents"])

@router.post("/", response_model=Agent)
def create_new_agent(agent: AgentCreate):
    return create_agent(agent)

@router.post("/extract-text")
async def extract_text_from_file(file: UploadFile = File(...)):
    extracted_text = ""
    try:
        content = await file.read()
        filename = file.filename.lower()

        if filename.endswith(".pdf"):
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + "\n"
        elif filename.endswith((".png", ".jpg", ".jpeg", ".tiff", ".bmp")):
            img = Image.open(io.BytesIO(content))
            extracted_text = pytesseract.image_to_string(img)
        else:
            # Assume text file
            extracted_text = content.decode("utf-8")
            
        return {"filename": file.filename, "text": extracted_text.strip()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

@router.get("/", response_model=List[Agent])
def list_agents():
    return get_all_agents()

@router.get("/categories", response_model=List[str])
def list_categories():
    return get_all_categories()

@router.get("/{agent_id}", response_model=Agent)
def read_agent(agent_id: str):
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.put("/{agent_id}", response_model=Agent)
def update_existing_agent(agent_id: str, agent: AgentUpdate):
    updated = update_agent(agent_id, agent)
    if not updated:
        raise HTTPException(status_code=404, detail="Agent not found")
    return updated

@router.delete("/{agent_id}")
def delete_existing_agent(agent_id: str):
    success = delete_agent(agent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"status": "success"}
