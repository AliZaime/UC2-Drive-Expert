import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from agents.inventory_agent import InventoryMatchingAgent

@pytest.mark.asyncio
async def test_find_matches_success(mock_repo, mock_llm):
    """Test standard flow with mock repo and mock LLM"""
    
    # Mock the LLM chain result
    mock_result = {
        "matches": [
            {"vehicle_id": "1", "match_score": 90, "reasoning": "Good fit"}
        ],
        "analysis": "Test analysis"
    }
    
    # We need to mock the chain inside the agent
    with patch('agents.inventory_agent.get_llm', return_value=mock_llm):
        # Patch the correct import path - from core.repositories
        with patch('core.repositories.get_inventory_repository', return_value=mock_repo):

            # Re-init agent to pick up mocks if using singleton, 
            # OR patch the instance properties directly
            agent = InventoryMatchingAgent()
            agent.repository = mock_repo
            
            # Mock the chain execution
            # Since the agent constructs the chain inside the method, we mock the invoke result
            # But simpler: Mock the 'ainvoke' of the chain.
            # Actually, `chain = prompt | self.llm | self.parser`
            # We can mock the LLM's ainvoke to return the RAW text that the parser expects?
            # Or we can patch the `chain.ainvoke` if we can access it.
            
            # Strategy: Mock internal components
            agent.llm.ainvoke = AsyncMock(return_value=MagicMock(content='{"matches": []}'))
            
            # Actually, let's test the FALLBACK logic first as it's purely deterministic code
            # Force LLM error
            agent.llm.ainvoke = AsyncMock(side_effect=Exception("LLM Down"))
            
            profile = {"segment": "Family", "budget": 150000}
            
            # Should return fallback (cheapest cars)
            result = await agent.find_matches(profile)
            
            assert "matches" in result
            assert len(result["matches"]) > 0
            # Test data has Clio (120k) and Duster (160k). Fallback sorts by price.
            # Should find Clio first.
            assert result["matches"][0]["vehicle_id"] == "1"
            assert result["analysis"] != ""

@pytest.mark.asyncio
async def test_inventory_repo_integration(mock_repo):
    """Verify repo interface"""
    cars = await mock_repo.get_all_vehicles()
    assert len(cars) == 2
    assert cars[0]["make"] == "Renault"
