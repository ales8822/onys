from fastapi import APIRouter, HTTPException
from typing import List
from .models import Agent, AgentCreate, AgentUpdate
from .service import (
    create_agent, get_all_agents, get_agent, 
    update_agent, delete_agent, get_all_categories
)

router = APIRouter(tags=["agents"])

@router.post("/", response_model=Agent)
def create_new_agent(agent: AgentCreate):
    return create_agent(agent)

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
