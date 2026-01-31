"""
JSON File Inventory Repository
Production-grade file-based implementation with async I/O and caching.
"""
import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiofiles

from src.infrastructure.repositories.base import InventoryRepository


class JSONFileInventoryRepository(InventoryRepository):
    """
    File-based inventory implementation.
    
    Features:
    - Async I/O to prevent event loop blocking
    - In-memory caching with TTL
    - Lazy loading (only reads file when needed)
    """
    
    def __init__(self, file_path: Path, cache_ttl_seconds: int = 300):
        self.file_path = file_path
        self._cache: Optional[List[Dict[str, Any]]] = None
        self._last_loaded: float = 0
        self._cache_ttl = cache_ttl_seconds
    
    async def _load(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Lazy async load with caching.
        
        Args:
            force_refresh: If True, bypass cache and reload from file
        """
        now = time.time()
        
        # Return cached data if valid
        if not force_refresh and self._cache is not None:
            if now - self._last_loaded < self._cache_ttl:
                return self._cache
        
        try:
            async with aiofiles.open(self.file_path, mode='r', encoding='utf-8') as f:
                content = await f.read()
                self._cache = json.loads(content)
                self._last_loaded = now
                return self._cache
        except FileNotFoundError:
            print(f"Warning: Inventory file not found at {self.file_path}")
            return []
        except json.JSONDecodeError as e:
            print(f"Error parsing inventory JSON: {e}")
            return []
        except Exception as e:
            print(f"Error loading inventory: {e}")
            return []
    
    async def get_all_vehicles(self) -> List[Dict[str, Any]]:
        """Get all vehicles in inventory"""
        return await self._load()
    
    async def get_vehicle_by_id(self, vehicle_id: str) -> Optional[Dict[str, Any]]:
        """Get vehicle by ID, VIN, or _id (MongoDB format)"""
        inventory = await self._load()
        vehicle_id_str = str(vehicle_id)
        
        for car in inventory:
            # Handle various ID formats
            cid = str(car.get('_id') or car.get('id') or car.get('vin') or '')
            if cid == vehicle_id_str:
                return car
        
        return None
    
    async def search_vehicles(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Search vehicles by criteria.
        
        Supported filters:
        - max_price: Maximum price
        - min_price: Minimum price
        - make: Vehicle make (exact match)
        - min_year: Minimum model year
        - max_year: Maximum model year
        - fuel_type: Fuel type (from specifications)
        - min_seats: Minimum number of seats
        """
        inventory = await self._load()
        results = []
        
        for car in inventory:
            match = True
            price = car.get('price', 0)
            
            # Price filters
            if "max_price" in criteria:
                if price > criteria['max_price']:
                    match = False
            if "min_price" in criteria:
                if price < criteria['min_price']:
                    match = False
            
            # Make filter
            if "make" in criteria:
                if car.get('make', '').lower() != criteria['make'].lower():
                    match = False
            
            # Year filters
            year = car.get('year', 0)
            if "min_year" in criteria:
                if year < criteria['min_year']:
                    match = False
            if "max_year" in criteria:
                if year > criteria['max_year']:
                    match = False
            
            # Specification filters
            specs = car.get('specifications', {})
            if "fuel_type" in criteria:
                if specs.get('fuelType', '').lower() != criteria['fuel_type'].lower():
                    match = False
            if "min_seats" in criteria:
                if specs.get('seats', 0) < criteria['min_seats']:
                    match = False
            
            if match:
                results.append(car)
        
        return results
    
    def invalidate_cache(self):
        """Force cache invalidation"""
        self._cache = None
        self._last_loaded = 0


# Singleton instance
_repo_instance: Optional[JSONFileInventoryRepository] = None


def get_inventory_repository() -> InventoryRepository:
    """
    Factory function for dependency injection.
    Returns singleton instance of inventory repository.
    """
    global _repo_instance
    if _repo_instance is None:
        # Default path: data/inventory.json relative to project root
        path = Path(__file__).parent.parent.parent.parent / "data" / "inventory.json"
        _repo_instance = JSONFileInventoryRepository(path)
    return _repo_instance
