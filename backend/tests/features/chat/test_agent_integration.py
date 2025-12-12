import pytest
from unittest.mock import AsyncMock, patch
from features.chat.service import process_chat
from features.chat.models import ChatRequest, ChatMessage
from features.agents.models import Agent

@pytest.mark.asyncio
async def test_process_chat_with_agent():
    # Mock data
    mock_agent = Agent(
        id="agent-123",
        name="Code Master",
        role="Developer",
        personality="Precise",
        expertise="Python",
        category="Dev",
        instructions="Always write clean code.",
        knowledge="PEP8 guidelines."
    )
    
    request = ChatRequest(
        chat_id="chat-1",
        provider_id="openai",
        model_id="gpt-4",
        messages=[ChatMessage(role="user", content="Hello")],
        agent_id="agent-123"
    )

    # Patch dependencies
    with patch("features.chat.service.get_provider_config") as mock_config, \
         patch("features.chat.service.get_instruction") as mock_instr, \
         patch("features.chat.service.save_session") as mock_save, \
         patch("features.chat.service.get_agent") as mock_get_agent, \
         patch("features.chat.service.send_to_openai_compatible") as mock_send:
        
        # Setup mocks
        mock_config.return_value = {"keys": ["sk-test"], "url": "https://api.openai.com"}
        mock_instr.return_value = None
        mock_get_agent.return_value = mock_agent
        
        # Mock the generator response from send_to_openai_compatible
        async def mock_generator(*args, **kwargs):
            yield 'data: {"choices": [{"delta": {"content": "Hello"}}]}\n\n'
            yield 'data: [DONE]\n\n'
        
        mock_send.side_effect = mock_generator

        # Execute
        response_gen = process_chat(request)
        chunks = []
        async for chunk in response_gen:
            chunks.append(chunk)

        # Verify get_agent was called
        mock_get_agent.assert_called_with("agent-123")

        # Verify system prompt injection
        # We need to check the arguments passed to send_to_openai_compatible
        call_args = mock_send.call_args
        assert call_args is not None
        
        # args[2] is 'messages' list
        messages_arg = call_args[0][2]
        system_msg = messages_arg[0]
        assert system_msg['role'] == 'system'
        
        # Check if agent details are in system prompt
        assert "Code Master" in system_msg['content']
        assert "Developer" in system_msg['content']
        assert "Precise" in system_msg['content']
        assert "Always write clean code." in system_msg['content']
        assert "PEP8 guidelines." in system_msg['content']
