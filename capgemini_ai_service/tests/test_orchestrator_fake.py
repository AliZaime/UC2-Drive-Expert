import asyncio
from agents.orchestrator_agent import orchestrator_agent

async def test_fake_orchestrator():
    print("--- 🧪 TEST: Proving Orchestrator is Fake ---")
    
    # fail-safe inputs
    inputs = {
        "customer_id": "test_user",
        "trade_in_id": "trade_123", # ID triggers the valuation node
        "trade_in_data": {"make": "Ferrari", "model": "LaFerrari", "year": 2022, "mileage": 5000, "condition": "Excellent" }, # Detailed car
        "preferences": {
            "vehicle_type": "SUV", 
            "monthly_budget": 5000, 
            "priorities": ["Speed"],
            "financing_preference": "Cash"
        }
    }

    print(f"Input Vehicle: {inputs['trade_in_data']['make']} {inputs['trade_in_data']['model']}")
    
    # Run Flow
    result = await orchestrator_agent.run_flow(inputs)
    
    # Check Valuation
    val_result = result.get("valuation_result", {})
    estimated = val_result.get("estimated_value")
    
    print(f"\n--- 📊 RESULT ---")
    print(f"Orchestrator says Value is: {estimated} MAD")
    
    if estimated == 70000:
        print("\n❌ PROOF: The Orchestrator returned the hardcoded 70,000 MAD.")
        print("   It completely ignored that I sent a Ferrari!")
    else:
        print("\n✅ SURPRISE: It actually calculated something?")

if __name__ == "__main__":
    asyncio.run(test_fake_orchestrator())
