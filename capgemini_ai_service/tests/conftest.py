import pytest
import sys
import os
from unittest.mock import MagicMock, AsyncMock

# Add src to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.fixture
def mock_repo():
    """Mock the InventoryRepository"""
    repo = MagicMock()
    repo.get_all_vehicles = AsyncMock(return_value=[
        {"id": "1", "make": "Renault", "model": "Clio", "year": 2019, "price": 120000},
        {"id": "2", "make": "Dacia", "model": "Duster", "year": 2021, "price": 160000}
    ])
    repo.get_vehicle_by_id = AsyncMock(return_value=
        {"id": "1", "make": "Renault", "model": "Clio", "year": 2019, "price": 120000}
    )
    return repo

@pytest.fixture
def mock_llm():
    """Mock the LLM response to avoid API calls"""
    llm = MagicMock()
    
    # Setup a mock response object that behaves like LangChain result
    mock_response = MagicMock()
    mock_response.content = '{"analysis": "test", "confidence": 0.9}'
    
    # If invoked directly
    llm.invoke = MagicMock(return_value=mock_response)
    llm.ainvoke = AsyncMock(return_value=mock_response)
    
    return llm

@pytest.fixture(autouse=True)
def override_dependencies(mock_repo, mock_llm):
    """Refactor agents to use mocks globally for unit tests"""
    # We will patch the modules in individual tests or use Dependency Injection overrides
    pass
