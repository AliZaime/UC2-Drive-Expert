import asyncio
from agents.negotiation.agent import negotiation_agent
from schemas.models import NegotiationRequestModel

async def test_negotiation_context():
    print("--- [TEST] Verifying Negotiation Context ---")
    
    # 1. Simulate Context passed from Frontend
    # We want to negotiate for the "Dacia Jogger" (ID: 1 in inventory.json)
    # Price: 220,000, Cost: 195,000
    current_offer = {
        "monthly": 3000,
        "duration": 60,
        "vehicle_id": "1",
        "vehicle_price": 220000,
        "trade_in_value": 0
    }
    
    # CRITICAL: Pass vehicle_context so agent knows which car we're negotiating
    vehicle_context = {
        "vehicle_id": "1",
        "name": "Dacia Jogger",  # Include the name for context
        "price": 220000,
        "cost": 195000  # Dealer cost for margin calculation
    }
    
    request = NegotiationRequestModel(
        session_id="test_sess_context_v2",  # New session ID to avoid caching
        customer_message="C'est beaucoup trop cher pour ce genre de voiture.",
        conversation_history=[],
        current_offer=current_offer,
        vehicle_context=vehicle_context  # Pass the vehicle context
    )
    
    print(f"Customer Message: {request.customer_message}")
    print(f"Vehicle Context: ID {current_offer['vehicle_id']} (Should be Dacia Jogger)")
    
    # 2. Run Agent
    response = await negotiation_agent.negotiate(request)
    
    print("\n--- [AGENT RESPONSE] ---")
    print(response.agent_message)
    
    # 3. Verification
    msg_lower = response.agent_message.lower()
    if "dacia" in msg_lower or "jogger" in msg_lower:
        print("\n[SUCCESS] The agent mentioned the car name!")
    else:
        print("\n[FAILURE] The agent gave a generic response without naming the car.")

if __name__ == "__main__":
    asyncio.run(test_negotiation_context())
