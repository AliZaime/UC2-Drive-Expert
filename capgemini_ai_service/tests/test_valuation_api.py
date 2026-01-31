
import pytest
from fastapi.testclient import TestClient
from schemas.models import ValuationRequestModel, VehicleData

@pytest.fixture(scope="module")
def client():
    from main import app
    return TestClient(app)

def test_valuation_endpoint(client):
    payload = {
        "trade_in_id": "test_123",
        "vehicle": {
            "make": "Toyota",
            "model": "Camry",
            "year": 2020,
            "mileage": 50000,
            "condition": "Good",
            "service_history": True,
            "accidents": False
        },
        "photos": []
    }
    
    # Mocking appropriate headers if API key is enforced in main.py logic (it uses Depends(verify_api_key))
    # Assuming default logic allows empty or specific key if env var not set, or we can mock env.
    # For now, let's try without headers assuming dev mode, or add if fails.
    
    response = client.post("/ai/valuation", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "estimated_value" in data
    assert "confidence_score" in data
    assert data["estimated_value"] > 0
    print(f"\nValuation Response: {data}")

if __name__ == "__main__":
    test_valuation_endpoint()
