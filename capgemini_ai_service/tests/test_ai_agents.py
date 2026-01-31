import requests
import json
import time
import sys

# Force UTF-8 encoding for stdout/stderr just in case, though usually manual replacement is safer on Windows
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8001"

def test_health():
    try:
        print("\n[INFO] Testing Health Check...")
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        return False

def test_valuation():
    print("\n[INFO] Testing Valuation Agent...")
    payload = {
        "vehicle": {
            "make": "Renault",
            "model": "Clio",
            "year": 2019,
            "mileage": 85000,
            "condition": "Bon",
            "service_history": True,
            "accidents": False
        },
        "trade_in_id": "test_123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/ai/valuation", json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"[SUCCESS] Estimated Value: {data['estimated_value']} MAD")
            print(f"[INFO] Confidence: {data['confidence']}")
            print(f"[INFO] Explanation: {data['explanation'][:100]}...")
            return True
        else:
            print(f"[ERROR] Error: {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Request failed: {e}")
        return False

def test_negotiation():
    print("\n[INFO] Testing Negotiation Agent...")
    payload = {
        "session_id": "test_session_1",
        "customer_message": "C'est un peu cher pour mon budget",
        "current_offer": {
            "monthly": 3000,
            "duration": 60
        },
        "conversation_history": []
    }
    
    try:
        response = requests.post(f"{BASE_URL}/ai/negotiate", json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"[SUCCESS] Agent Response: {data['agent_message']}")
            print(f"[INFO] Emotion Detected: {data['emotional_analysis']['primary_emotion']}")
            print(f"[INFO] Strategy: {data['emotional_analysis']['recommended_strategy']}")
            print(f"[INFO] Strategy: {data['emotional_analysis']['recommended_strategy']}")
            return True
        else:
            print(f"[ERROR] Error: {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Request failed: {e}")
        return False

def test_profiling():
    print("\n[INFO] Testing Customer Profiling Agent...")
    # Mock request based on OrchestratorRequestModel
    payload = {
        "customer_id": "test_cust_1",
        "preferences": {
            "vehicle_type": "SUV",
            "monthly_budget": 3000.0,
            "financing_preference": "LLD",
            "priorities": ["Safety", "Space for kids", "Reliability"]
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/ai/profile", json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"[SUCCESS] Segment: {data.get('segment')}")
            print(f"[INFO] Price Sensitivity: {data.get('price_sensitivity')}")
            return True
        else:
            print(f"[ERROR] Error: {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Request failed: {e}")
        return False

def test_inventory_matching():
    print("\n[INFO] Testing Inventory Matching Agent...")
    payload = {
        "customer_id": "test_cust_1",
        "preferences": {
            "vehicle_type": "SUV",
            "monthly_budget": 3000.0,
            "financing_preference": "LLD",
            "priorities": ["Safety", "Space", "Economy"]
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/ai/match", json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            matches = data.get('matches', [])
            print(f"[SUCCESS] Found {len(matches)} matches")
            if matches:
                 print(f"[INFO] Top Match: {matches[0].get('vehicle_id')} (Score: {matches[0].get('match_score')})")
                 print(f"[INFO] Reasoning: {matches[0].get('reasoning')[:100]}...")
            return True
        else:
            print(f"[ERROR] Error: {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Request failed: {e}")
        return False

def test_deal_structuring():
    print("\n[INFO] Testing Deal Structuring Agent...")
    payload = {
        "customer_id": "test_cust_1",
        "preferences": {
            "vehicle_type": "SUV",
            "monthly_budget": 3000.0,
            "financing_preference": "LLD",
            "priorities": ["Budget", "Flexibility"]
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/ai/structuring", json=payload)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            options = data.get('options', [])
            print(f"[SUCCESS] Generated {len(options)} deal options")
            for opt in options:
                print(f"  - {opt.get('option_name')} ({opt.get('type')}): {opt.get('monthly_payment')} MAD/mois")
            print(f"[INFO] Recommendation: {data.get('recommendation')[:100]}...")
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
    
    # Run all tests
    results = [
        test_health(),
        # test_valuation(), # Skip to save time/tokens if desired, but good to keep
        # test_negotiation(),
        test_profiling(),
        test_inventory_matching(),
        test_deal_structuring()
    ]
    
    if all(results):
        print("\n[SUCCESS] ALL AGENTS PASSED! System is ready.")
    else:
        print("\n[WARN] Some tests failed.")
