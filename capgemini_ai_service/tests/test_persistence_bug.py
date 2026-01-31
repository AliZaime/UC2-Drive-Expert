import sys
import os
from datetime import datetime

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.domain.negotiation.entities import NegotiationSession, CustomerProfile

def test_session_persistence():
    print("Testing NegotiationSession persistence...")
    
    # 1. Create session with all fields
    session = NegotiationSession(
        session_id="test-123",
        customer_id="cust-456"
    )
    session.target_vehicle_name = "Renault Clio"
    session.target_vehicle_id = "v-001"
    session.target_vehicle_price = 150000.0
    session.vehicle_features = ["Bluetooth", "GPS"]
    session.vehicle_specs = {"engine": "1.5 dCi", "seats": 5}
    session.vehicle_year = 2022
    session.comparison_vehicles = [{"make": "Dacia", "model": "Sandero", "price": 130000}]
    session.language = "fr"
    
    # 2. Serialize
    data = session.to_dict()
    print("Serialized data keys:", data.keys())
    
    # 3. Deserialize
    reproduced = NegotiationSession.from_dict(data)
    
    # 4. Verify
    fields_to_check = [
        "session_id", "customer_id", "target_vehicle_name", "target_vehicle_id",
        "target_vehicle_price", "vehicle_features", "vehicle_specs", 
        "vehicle_year", "comparison_vehicles", "language"
    ]
    
    success = True
    for field in fields_to_check:
        val1 = getattr(session, field)
        val2 = getattr(reproduced, field)
        if val1 == val2:
            print(f"✅ Field '{field}' matches")
        else:
            print(f"❌ Field '{field}' MISMATCH: {val1} != {val2}")
            success = False
            
    if success:
        print("\n✨ ALL FIELDS PERSISTED CORRECTLY! ✨")
    else:
        print("\n🚨 PERSISTENCE TEST FAILED! 🚨")
        sys.exit(1)

if __name__ == "__main__":
    test_session_persistence()
