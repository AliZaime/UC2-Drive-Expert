import requests
import json
import sys

BASE_URL = "http://localhost:8000/ai/negotiate"

def run_test(name, payload, checks):
    print(f"\n--- Running Test: {name} ---")
    try:
        response = requests.post(BASE_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        
        print("✅ API Call Successful")
        
        # Run checks
        all_passed = True
        for check_name, check_func in checks.items():
            if check_func(data):
                print(f"✅ PASS: {check_name}")
            else:
                print(f"❌ FAIL: {check_name}")
                print(f"   Response: {json.dumps(data, indent=2)[:500]}...")
                all_passed = False
        
        return all_passed
    except Exception as e:
        print(f"❌ CRITICAL FAIL: API Request failed - {e}")
        return False

def main():
    # 1. Test Greeting & Context
    payload_1 = {
        "session_id": "test_auto_1",
        "customer_message": "bonjour",
        "vehicle_context": {
            "make": "Peugeot",
            "model": "2008",
            "year": 2023,
            "price": 185000,
            "features": ["GPS", "Climatisation"],
            "specifications": {"fuelType": "Essence", "horsePower": 130}
        }
    }
    
    checks_1 = {
        "Has Agent Message": lambda d: "agent_message" in d and len(d["agent_message"]) > 0,
        "Vehicle Card Present": lambda d: "vehicle_card" in d and d["vehicle_card"] is not None,
        "Vehicle Name Correct": lambda d: d["vehicle_card"]["name"] == "Peugeot 2008"
    }
    
    if not run_test("Greeting & Vehicle Context", payload_1, checks_1):
        sys.exit(1)

    # 2. Test Price Accuracy
    payload_2 = {
        "session_id": "test_auto_1",
        "customer_message": "c'est combien?",
        "vehicle_context": {
            "make": "Peugeot",
            "model": "2008",
            "price": 185000
        }
    }
    
    checks_2 = {
        "Price Mentioned in MAD": lambda d: "185,000" in d["agent_message"] or "185 000" in d["agent_message"] or "185000" in d["agent_message"],
        "Currency is MAD": lambda d: "MAD" in d["agent_message"] or "dirhams" in d["agent_message"].lower()
    }
    
    run_test("Price Accuracy Check", payload_2, checks_2)

    # 3. Test Comparison Feature
    payload_3 = {
        "session_id": "test_auto_comparison",
        "customer_message": "compare avec la clio",
        "vehicle_context": {
            "make": "Peugeot", 
            "model": "2008",
             "price": 185000
        },
        "comparison_vehicles": [
            {
                "make": "Renault",
                "model": "Clio",
                "price": 125000,
                "features": ["GPS"]
            },
            {
                "make": "Peugeot",
                "model": "2008",
                "price": 185000,
                "features": ["GPS", "Caméra 360"]
            }
        ]
    }
    
    checks_3 = {
        "Comparison Context Acknowledged": lambda d: "Clio" in d["agent_message"] or "Renault" in d["agent_message"],
        "Mentions Comparison Price": lambda d: "125" in d["agent_message"] or "125,000" in d["agent_message"]
    }
    
    run_test("Vehicle Comparison", payload_3, checks_3)

if __name__ == "__main__":
    main()
