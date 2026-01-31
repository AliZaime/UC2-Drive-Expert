"""
Abstract Repository Interfaces
Defines contracts for data access - enables easy swapping of implementations.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class VehicleEntity:
    """Domain entity for a vehicle in inventory"""
    id: str
    make: str
    model: str
    year: int
    price: float
    cost: float = 0.0  # Dealer cost
    vin: Optional[str] = None
    specifications: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


class InventoryRepository(ABC):
    """
    Abstract interface for vehicle inventory access.
    
    Implementations can be:
    - JSONFileInventoryRepository (file-based, current)
    - MongoInventoryRepository (MongoDB)
    - PostgresInventoryRepository (SQL)
    """
    
    @abstractmethod
    async def get_all_vehicles(self) -> List[Dict[str, Any]]:
        """Get all vehicles in inventory"""
        pass
    
    @abstractmethod
    async def get_vehicle_by_id(self, vehicle_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific vehicle by ID or VIN"""
        pass
    
    @abstractmethod
    async def search_vehicles(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Search vehicles by criteria.
        
        Criteria examples:
        - max_price: 200000
        - min_year: 2020
        - make: "Renault"
        - fuel_type: "Diesel"
        """
        pass
    
    async def get_vehicles_in_budget(
        self, 
        max_price: float, 
        min_price: float = 0
    ) -> List[Dict[str, Any]]:
        """Convenience method for budget-based search"""
        return await self.search_vehicles({
            "max_price": max_price,
            "min_price": min_price,
        })


class SessionRepository(ABC):
    """
    Abstract interface for negotiation session storage.
    
    Implementations can be:
    - InMemorySessionStore (development)
    - RedisSessionStore (production)
    - PostgresSessionStore (persistent)
    """
    
    @abstractmethod
    async def save(self, session: Any) -> None:
        """Save or update a session"""
        pass
    
    @abstractmethod
    async def get(self, session_id: str) -> Optional[Any]:
        """Get a session by ID"""
        pass
    
    @abstractmethod
    async def delete(self, session_id: str) -> bool:
        """Delete a session, returns True if deleted"""
        pass
    
    @abstractmethod
    async def list_active(self, customer_id: Optional[str] = None) -> List[Any]:
        """List active sessions, optionally filtered by customer"""
        pass
    
    async def exists(self, session_id: str) -> bool:
        """Check if session exists"""
        return await self.get(session_id) is not None
