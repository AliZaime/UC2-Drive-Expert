from typing import List, Dict, Any, Optional

class ComparisonService:
    """Handles vehicle comparison and alternatives search"""
    
    def __init__(self, inventory_agent):
        self.inventory_agent = inventory_agent

    async def find_alternative_vehicles(
        self, 
        current_price: float, 
        customer_budget: float,
        limit: int = 2
    ) -> List[Dict[str, Any]]:
        """Find cheaper alternatives when customer can't afford current vehicle"""
        
        # This currently relies on the Inventory Agent
        # In the monolithic Code, this logic was mixed.
        # Here we just delegate properly.
        
        # Mock profile for search
        profile = {
            "monthly_budget": customer_budget,
            "segment": "Budget Conscious", 
            "priorities": ["Price"],
            "price_sensitivity": "High"
        }
        
        result = await self.inventory_agent.find_matches(profile, inventory=None)
        matches = result.get("matches", [])
        
        # Filter to ensure they are actually cheaper
        alternatives = [
            m for m in matches 
            if m.get("price", float('inf')) < current_price
        ]
        
        return alternatives[:limit]
