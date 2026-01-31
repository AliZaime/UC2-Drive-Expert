import requests
import json
import time
import sys

# Force UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8001"

def test_orchestrator():
    print("\n[INFO] Testing Full Orchestration Workflow...")
    
    # Simulate a full user request
    payload = {
        "customer_id": "cust_demo_001",
        "trade_in_id": "trade_demo_001", # Triggers Valuation
        "preferences": {
            "vehicle_type": "SUV",
            "monthly_budget": 3500.0,
            "financing_preference": "LLD",
            "priorities": ["Safety", "Family Space", "Low consumption"]
        }
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/ai/orchestrate", json=payload)
        duration = time.time() - start_time
        
        print(f"Status: {response.status_code}")
        print(f"Time: {duration:.2f}s")
        
        if response.status_code == 200:
            data = response.json()
            
            print("\n--- RESULTS ---")
            print(f"[SUCCESS] Session ID: {data.get('session_id')}")
            
            # Profile
            prof = data.get('customer_profile', {})
            print(f"\n[PROFILE] Segment: {prof.get('segment')} | Sensitivity: {prof.get('price_sensitivity')}")
            
            # Matches
            matches = data.get('vehicle_matches', [])
            print(f"\n[INVENTORY] Found {len(matches)} matches")
            if matches:
                top = matches[0]
                print(f"  Top Pick: {top.get('vehicle_id')} (Score: {top.get('match_score')})")
                
            # Deal
            deals = data.get('deal_options', [])
            print(f"\n[DEAL] Generated {len(deals)} options")
            for d in deals:
                print(f"  - {d.get('option_name')} ({d.get('type')}): {d.get('monthly_payment')} MAD")
                
            # Agent Steps (Explainability)
            steps = data.get('agent_steps', [])
            print(f"\n[TRACE] Agent Workflow ({len(steps)} steps):")
            for i, step in enumerate(steps, 1):
                print(f"  {i}. {step.get('agent_name')}: {step.get('action')}")
                
            return True
        else:
            print(f"[ERROR] Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Request failed: {e}")
        return False

if __name__ == "__main__":
    print("[INFO] Waiting for service to start...")
    time.sleep(3)
    
    if test_orchestrator():
        print("\n[SUCCESS] ORCHESTRATOR PASSED! The brain is fully connected.")
    else:
        print("\n[FAIL] Orchestration failed.")
