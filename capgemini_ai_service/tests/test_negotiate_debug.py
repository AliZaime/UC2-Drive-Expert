import requests
import json
import sys

# Force UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8001"

def test_negotiation():
    print("\n[INFO] Testing Negotiation Endpoint...")
    
    payload = {
        "session_id": "debug_session_001",
        "customer_message": "Hello, I am interested in the car",
        "conversation_history": [],
        "current_offer": None
    }
    
    try:
        response = requests.post(f"{BASE_URL}/ai/negotiate", json=payload)
        print(f"Status Code: {response.status_code}")
        print("Response Body:")
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(response.text)
            
    except Exception as e:
        print(f"[ERROR] Request failed: {e}")

if __name__ == "__main__":
    test_negotiation()
