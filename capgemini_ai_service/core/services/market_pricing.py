from abc import ABC, abstractmethod
import random

class MarketPricingService(ABC):
    """Interface for retrieving market pricing data"""
    
    @abstractmethod
    async def get_base_price(self, make: str, model: str, year: int) -> float:
        """Get base market price for a vehicle"""
        pass

class MockPricingService(MarketPricingService):
    """Mock implementation for Hackathon/Dev (Simulates external API)"""
    
    async def get_base_price(self, make: str, model: str, year: int) -> float:
        # Simple simulated depreciation logic
        current_year = 2026
        age = current_year - year
        
        # Base value by brand tier (simplified)
        premium_brands = ["bmw", "mercedes", "audi", "volvo"]
        economy_brands = ["dacia", "renault", "peugeot", "citroen"]
        
        if make.lower() in premium_brands:
            start_price = 400000
            depreciation_rate = 0.15
        elif make.lower() in economy_brands:
            start_price = 180000
            depreciation_rate = 0.12
        else:
            start_price = 250000
            depreciation_rate = 0.14
            
        # Calculate depreciated value
        value = start_price * ((1 - depreciation_rate) ** age)
        
        # Add some random variance for "market fluctuation"
        variance = random.uniform(0.95, 1.05)
        
        return round(value * variance, -2) # Round to nearest 100
