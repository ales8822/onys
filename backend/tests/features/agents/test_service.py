import pytest
import os
import json
from features.agents.service import create_agent, get_all_agents, get_agent, update_agent, delete_agent, get_all_categories
from features.agents.models import AgentCreate, AgentUpdate

# Mock data file path for testing
TEST_DATA_FILE = "backend/data/test_agents.json"

@pytest.fixture(autouse=True)
def setup_teardown():
    # Setup: Ensure test data file is empty or doesn't exist
    if os.path.exists(TEST_DATA_FILE):
        os.remove(TEST_DATA_FILE)
    
    # Patch the DATA_FILE constant in service (we'll need to make sure service allows this or use a config)
    # For simplicity in this TDD step, we'll assume the service uses a global we can patch or an env var.
    # Here we will just set an environment variable that the service module should check.
    os.environ["AGENTS_DATA_FILE"] = TEST_DATA_FILE
    
    yield
    
    # Teardown
    if os.path.exists(TEST_DATA_FILE):
        os.remove(TEST_DATA_FILE)

def test_create_agent():
    agent_data = AgentCreate(
        name="Test Agent",
        role="Tester",
        personality="Helpful",
        expertise="Testing",
        category="Dev",
        instructions="Do tests",
        knowledge="Test knowledge"
    )
    agent = create_agent(agent_data)
    assert agent.id is not None
    assert agent.name == "Test Agent"
    assert agent.category == "Dev"

def test_get_all_agents():
    create_agent(AgentCreate(name="A1", role="R1", personality="P1", expertise="E1", category="C1"))
    create_agent(AgentCreate(name="A2", role="R2", personality="P2", expertise="E2", category="C2"))
    
    agents = get_all_agents()
    assert len(agents) == 2

def test_get_agent():
    created = create_agent(AgentCreate(name="Target", role="R", personality="P", expertise="E", category="C"))
    fetched = get_agent(created.id)
    assert fetched is not None
    assert fetched.name == "Target"

def test_update_agent():
    created = create_agent(AgentCreate(name="Original", role="R", personality="P", expertise="E", category="C"))
    updated = update_agent(created.id, AgentUpdate(name="Updated", role="New Role"))
    assert updated.name == "Updated"
    assert updated.role == "New Role"
    assert updated.personality == "P" # Should remain unchanged

def test_delete_agent():
    created = create_agent(AgentCreate(name="To Delete", role="R", personality="P", expertise="E", category="C"))
    delete_agent(created.id)
    assert get_agent(created.id) is None

def test_get_all_categories():
    create_agent(AgentCreate(name="A1", role="R", personality="P", expertise="E", category="Dev"))
    create_agent(AgentCreate(name="A2", role="R", personality="P", expertise="E", category="Dev"))
    create_agent(AgentCreate(name="A3", role="R", personality="P", expertise="E", category="Marketing"))
    
    categories = get_all_categories()
    assert "Dev" in categories
    assert "Marketing" in categories
    assert len(categories) == 2
