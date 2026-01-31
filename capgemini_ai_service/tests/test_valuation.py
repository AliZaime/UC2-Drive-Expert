import pytest
from unittest.mock import AsyncMock
from agents.valuation_agent import ValuationAgent
from schemas.models import ValuationRequestModel, VehicleData

@pytest.mark.asyncio
async def test_valuation_calculation(mock_repo):
    """Test detailed math for valuation"""
    agent = ValuationAgent()
    agent.repo = mock_repo
    # Mock LLM analysis
    agent._generate_llm_analysis = AsyncMock(return_value="AI Reason")
    
    # Mock base price logic to return fixed values to test formula
    # Mock _get_market_base_price to return (100000, 100000km, "medium")
    agent._get_market_base_price = AsyncMock(return_value=100000)
    
    # Scenario 1: Excellent Condition (+8%) and Low Mileage (-20% distance -> +5% value)
    vehicle = VehicleData(
        make="Renault", model="Clio", year=2019,
        mileage=80000, # 20% less than avg 100k
        condition="Excellent",
        service_history=True,
        accidents=False
    )
    request = ValuationRequestModel(trade_in_id="123", vehicle=vehicle)
    
    result = await agent.valuate(request)
    
    # Base: 100,000
    # Condition: +8,000 (1.08)
    # Mileage: Uses year-based avg. 2019 car (7 years) -> avg 140k. 80k is 42% under -> +5%
    # So Mileage: +5,000
    # History: +3,000 (3%)
    # No Acc: +2,000 (2%)
    # Total Adds: 8k + 5k + 3k + 2k = 18,000.
    # Expected: 118,000.
    
    assert result.estimated_value == 118000
    assert len(result.breakdown.adjustments) == 4

@pytest.mark.asyncio
async def test_valuation_logging(mock_repo):
    """Ensure agent steps are generated"""
    agent = ValuationAgent()
    agent.repo = mock_repo
    agent._get_market_base_price = AsyncMock(return_value=100000)
    agent._generate_llm_analysis = AsyncMock(return_value="AI Reason")
    
    vehicle = VehicleData(
        make="Renault", model="Clio", year=2019, mileage=100000, condition="Bon"
    )
    request = ValuationRequestModel(trade_in_id="123", vehicle=vehicle)
    
    result = await agent.valuate(request)
    
    assert len(result.agent_steps) > 0
    assert result.agent_steps[0].action == "Recherche prix marché"
