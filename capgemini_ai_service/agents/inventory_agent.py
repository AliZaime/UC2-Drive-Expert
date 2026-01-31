from typing import Dict, Any, List, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from agents import get_llm

class VehicleMatch(BaseModel):
    """Structured output for a single vehicle match"""
    vehicle_id: str = Field(description="ID or VIN of the matched vehicle")
    make: str = Field(description="Make of the vehicle")
    model: str = Field(description="Model of the vehicle")
    year: int = Field(description="Year of the vehicle")
    price: float = Field(description="Price of the vehicle in MAD")
    match_score: int = Field(description="Match score from 0 to 100")
    reasoning: str = Field(description="Why this vehicle fits the customer profile")
    selling_points: List[str] = Field(description="Key features to highlight to this specific customer")

class InventoryMatchResult(BaseModel):
    """List of recommended vehicles"""
    matches: List[VehicleMatch] = Field(description="Top 3 recommended vehicles")
    analysis: str = Field(description="Overall analysis of the inventory fit")

import json
import os
from config.settings import settings

class InventoryMatchingAgent:
    def __init__(self):
        self.llm = get_llm()
        self.parser = JsonOutputParser(pydantic_object=InventoryMatchResult)
        # Dependency Injection (Manual for now, could use FastAPI Depends)
        from core.repositories import get_inventory_repository
        self.repository = get_inventory_repository()
        
    async def find_matches(self, 
                    profile: Dict[str, Any], 
                    inventory: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Rank inventory based on customer profile.
        Async compatible.
        """
        # Pre-filter inventory using Repository Search (Scalable)
        budget = profile.get('monthly_budget', 0)
        
        if inventory is None:
            criteria = {}
            if budget and budget > 0:
                # Rough 60-month estimate + 20% buffer
                max_price = (budget * 60) * 1.2
                criteria["max_price"] = max_price
                
            filtered_inventory = await self.repository.search_vehicles(criteria)
        else:
            # If inventory was passed manually (e.g. testing), filter it here
            max_price_estimate = (budget * 60) * 1.2 if budget else float('inf')
            filtered_inventory = [
                v for v in inventory
                if v.get('price', 0) <= max_price_estimate
            ]
        
        # Limit to 15 vehicles max for token efficiency
        filtered_inventory = filtered_inventory[:15]
        
        # Format inventory for the prompt (summary to save tokens)
        inventory_summary = []
        for v in filtered_inventory:
            # Handle both MongoDB objects (with _id) and demo data
            vid = v.get('_id') or v.get('vin') or str(v.get('id', 'unknown'))
            summary = f"ID: {vid} | {v.get('make')} {v.get('model')} ({v.get('year')}) | {v.get('price')} MAD | {v.get('specifications', {}).get('fuelType')} | Seats: {v.get('specifications', {}).get('seats')}"
            inventory_summary.append(summary)
            
        inventory_text = "\n".join(inventory_summary)
        
        prompt = ChatPromptTemplate.from_template("""
        Tu es un expert en recommandation automobile.
        Ta mission est de trouver les MEILLEURS véhicules pour ce client parmi notre stock.
        
        PROFIL CLIENT:
        Segment: {segment}
        Priorités: {priorities}
        Sensibilité Prix: {price_sensitivity}
        Budget (si connu): {budget}
        
        INVENTAIRE DISPONIBLE:
        {inventory_text}
        
        Tâche:
        1. Sélectionne les 3 véhicules les plus pertinents.
        2. Extrais fidèlement les détails (Marque, Modèle, Année, Prix, ID) de l'inventaire fourni.
        3. Attribue un score de compatibilité (0-100).
        4. Explique POURQUOI ce véhicule correspond à CE profil (ex: "Idéal pour la famille car 7 places").
        5. Liste les arguments de vente clés pour ce client spécifique.
        
        {format_instructions}
        """)
        
        chain = prompt | self.llm | self.parser
        
        try:
            result = await chain.ainvoke({
                "segment": profile.get('segment', 'Standard'),
                "priorities": str(profile.get('priorities', [])),
                "price_sensitivity": profile.get('price_sensitivity', 'Medium'),
                "budget": profile.get('monthly_budget', 'Non spécifié'),
                "inventory_text": inventory_text,
                "format_instructions": self.parser.get_format_instructions()
            })
            
            return result
            
        except Exception as e:
            print(f"Inventory Matching Error: {e}")
            return self._get_fallback_matches(inventory)
            
    def _get_fallback_matches(self, inventory) -> Dict[str, Any]:
        """Simple fallback if LLM fails: return cheapest 3"""
        sorted_inv = sorted(inventory, key=lambda x: x.get('price', 0))[:3]
        matches = []
        for v in sorted_inv:
            vid = v.get('_id') or v.get('vin') or str(v.get('id', 'unknown'))
            matches.append({
                "vehicle_id": vid,
                "match_score": 50,
                "reasoning": "Recommandation basée sur le prix (Fallback)",
                "selling_points": ["Prix compétitif"]
            })
            
        return {
            "matches": matches,
            "analysis": "Recommandation automatique (Service IA indisponible)"
        }

# Singleton instance
inventory_agent = InventoryMatchingAgent()
