import json
import os
from uuid import uuid4
from typing import List, Optional
from .models import Agent, AgentCreate, AgentUpdate

# Allow overriding via env var for testing
def get_data_file():
    return os.environ.get("AGENTS_DATA_FILE", "backend/data/agents.json")

def _ensure_data_dir():
    data_file = get_data_file()
    os.makedirs(os.path.dirname(data_file), exist_ok=True)
    if not os.path.exists(data_file):
        with open(data_file, "w") as f:
            json.dump([], f)

def _load_agents() -> List[dict]:
    _ensure_data_dir()
    data_file = get_data_file()
    try:
        with open(data_file, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def _save_agents(agents: List[dict]):
    _ensure_data_dir()
    data_file = get_data_file()
    with open(data_file, "w") as f:
        json.dump(agents, f, indent=2)

def create_agent(data: AgentCreate) -> Agent:
    agents = _load_agents()
    new_agent = Agent(
        id=str(uuid4()),
        **data.model_dump()
    )
    agents.append(new_agent.model_dump())
    _save_agents(agents)
    return new_agent

def get_all_agents() -> List[Agent]:
    agents_data = _load_agents()
    return [Agent(**a) for a in agents_data]

def get_agent(agent_id: str) -> Optional[Agent]:
    agents = _load_agents()
    for a in agents:
        if a["id"] == agent_id:
            return Agent(**a)
    return None

def update_agent(agent_id: str, data: AgentUpdate) -> Optional[Agent]:
    agents = _load_agents()
    for i, a in enumerate(agents):
        if a["id"] == agent_id:
            current_agent = Agent(**a)
            update_data = data.model_dump(exclude_unset=True)
            updated_agent = current_agent.model_copy(update=update_data)
            agents[i] = updated_agent.model_dump()
            _save_agents(agents)
            return updated_agent
    return None

def delete_agent(agent_id: str) -> bool:
    agents = _load_agents()
    initial_len = len(agents)
    agents = [a for a in agents if a["id"] != agent_id]
    if len(agents) < initial_len:
        _save_agents(agents)
        return True
    return False

def get_all_categories() -> List[str]:
    agents = get_all_agents()
    categories = set(a.category for a in agents if a.category)
    return sorted(list(categories))
