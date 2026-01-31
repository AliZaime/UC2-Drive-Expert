"""
Data Access Layer (Repository Pattern)
Abstracts data storage implementation details from business logic.
Currently supports:
- JSONFileInventoryRepository: Non-blocking file-based storage
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import json
import aiofiles
from pathlib import Path

class InventoryRepository(ABC):
    """Abstract interface for vehicle inventory access"""
    
    @abstractmethod
    async def get_all_vehicles(self) -> List[Dict[str, Any]]:
        pass
    
    @abstractmethod
    async def get_vehicle_by_id(self, vehicle_id: str) -> Optional[Dict[str, Any]]:
        pass
    
    @abstractmethod
    async def search_vehicles(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        pass

class JSONFileInventoryRepository(InventoryRepository):
    """
    Production-grade file-based implementation.
    Uses Async I/O to prevent event loop blocking.
    Simple in-memory caching for read performance.
    """
    
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self._cache: Optional[List[Dict[str, Any]]] = None
        self._last_loaded = 0
    
    async def _load(self) -> List[Dict[str, Any]]:
        """Lazy async load"""
        # In a real app we'd check file mtime to invalidate cache
        if self._cache is not None:
            return self._cache
            
        try:
            async with aiofiles.open(self.file_path, mode='r', encoding='utf-8') as f:
                content = await f.read()
                self._cache = json.loads(content)
                return self._cache
        except FileNotFoundError:
            print(f"Warning: Inventory file not found at {self.file_path}")
            return []
        except Exception as e:
            print(f"Error loading inventory: {e}")
            return []

    async def get_all_vehicles(self) -> List[Dict[str, Any]]:
        return await self._load()

    async def get_vehicle_by_id(self, vehicle_id: str) -> Optional[Dict[str, Any]]:
        inventory = await self._load()
        vehicle_id_str = str(vehicle_id)
        
        for car in inventory:
            # Handle various ID formats (Mongo _id vs string id)
            cid = str(car.get('_id') or car.get('id', ''))
            if cid == vehicle_id_str:
                return car
        return None

    async def search_vehicles(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        # Basic filtering logic
        inventory = await self._load()
        results = []
        
        for car in inventory:
            match = True
            # Example filter: Price max
            if "max_price" in criteria:
                if car.get('price', 0) > criteria['max_price']:
                    match = False
            
            if match:
                results.append(car)
                
        return results

# Factory / Singleton
from config.settings import settings
# Assuming settings might have DATA_DIR in future, hardcoding relative for now
_repo_instance = None

def get_inventory_repository() -> InventoryRepository:
    global _repo_instance
    if _repo_instance is None:
        path = Path(__file__).parent.parent / "data" / "inventory.json"
        _repo_instance = JSONFileInventoryRepository(path)
    return _repo_instance
