"""
Valuation Agent with Explainable AI
Provides transparent trade-in vehicle valuations with detailed reasoning
"""
from datetime import datetime
from typing import Dict, Any, List
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from config.settings import settings
from schemas.models import (
    ValuationRequestModel,
    ValuationResponseModel,
    ValuationBreakdownModel,
    AdjustmentDetail,
    AgentStepModel
)
from core.services.market_pricing import MarketPricingService, MockPricingService
from core.repositories import get_inventory_repository

CONDITION_MULTIPLIERS = {
    "Excellent": 1.08,
    "Très bon": 1.05,
    "Bon": 1.0,
    "Moyen": 0.93,
    "Mauvais": 0.85
}

class ValuationAgent:
    """Agent specializing in vehicle trade-in valuation with explainable AI"""
    
    def __init__(self, pricing_service: MarketPricingService = None):
        self.llm = ChatGroq(
            groq_api_key=settings.groq_api_key,
            model_name=settings.default_model,
            temperature=0.3,
            max_tokens=1500
        )
        self.agent_steps: List[AgentStepModel] = []
        
        # Dependency Injection
        self.pricing_service = pricing_service or MockPricingService()
        self.repo = get_inventory_repository()
    
    def _log_step(self, action: str, reasoning: str, data: Dict[str, Any], confidence: float):
        """Log agent step for explainability"""
        step = AgentStepModel(
            agent_name="Valuation Agent",
            action=action,
            reasoning=reasoning,
            data=data,
            confidence=confidence,
            timestamp=datetime.now()
        )
        self.agent_steps.append(step)
        return step
    
    async def _get_market_base_price(self, make: str, model: str, year: int) -> float:
        """
        Get base market price using external service
        """
        # Try to find similar vehicles in inventory first (Comparables)
        # This hybrid approach uses internal data + external market data
        
        # 1. External Market Value
        base_market_value = await self.pricing_service.get_base_price(make, model, year)
        
        # 2. Internal Inventory Check (Optional refinement)
        # In a real system, we'd weigh these two. For now, rely on specific service.
        return base_market_value
    
    def _calculate_mileage_adjustment(self, actual_mileage: int, base_price: float, year: int) -> tuple[float, str]:
        """Calculate adjustment based on mileage"""
        # Estimated average yearly mileage in Morocco ~20k km
        current_year = 2026
        age = max(1, current_year - year)
        avg_mileage = age * 20000
        
        diff_percentage = ((actual_mileage - avg_mileage) / avg_mileage) * 100
        
        if diff_percentage < -20:
            adjustment = base_price * 0.05
            reason = f"Kilométrage très bas ({int(abs(diff_percentage))}% sous la moyenne)"
        elif diff_percentage < -10:
            adjustment = base_price * 0.03
            reason = f"Kilométrage inférieur à la moyenne ({int(abs(diff_percentage))}%)"
        elif diff_percentage < 10:
            adjustment = 0
            reason = "Kilométrage moyen pour l'année"
        elif diff_percentage < 20:
            adjustment = base_price * -0.03
            reason = f"Kilométrage supérieur à la moyenne (+{int(diff_percentage)}%)"
        else:
            adjustment = base_price * -0.05
            reason = f"Kilométrage très élevé (+{int(diff_percentage)}%)"
        
        return adjustment, reason
    
    async def _generate_llm_analysis(self, vehicle_data: Dict[str, Any], base_price: float) -> str:
        """Use LLM to generate additional qualitative insights"""
        prompt = ChatPromptTemplate.from_template(
            """Tu es un expert en évaluation de véhicules d'occasion au Maroc.
            
            Véhicule: {make} {model} {year}
            Kilométrage: {mileage} km
            État: {condition}
            
            Prix de base estimé: {base_price} MAD
            
            Fournis une analyse courte (2-3 phrases) sur:
            1. La demande actuelle.
            2. Facteurs affectant la valeur.
            
            Réponds en français, sois concis et professionnel."""
        )
        
        chain = prompt | self.llm
        response = await chain.ainvoke({
            "make": vehicle_data["make"],
            "model": vehicle_data["model"],
            "year": vehicle_data["year"],
            "mileage": vehicle_data["mileage"],
            "condition": vehicle_data["condition"],
            "base_price": base_price
        })
        return response.content
    
    async def valuate(self, request: ValuationRequestModel) -> ValuationResponseModel:
        """
        Perform trade-in valuation with full explainability
        """
        self.agent_steps = []  # Reset steps
        
        vehicle = request.vehicle
        vehicle_dict = vehicle.model_dump()
        
        # Step 1: Get market base price (Async)
        base_price = await self._get_market_base_price(
            vehicle.make, vehicle.model, vehicle.year
        )
        
        self._log_step(
            action="Recherche prix marché",
            reasoning=f"Consulté MarketPricingService pour {vehicle.make} {vehicle.model} {vehicle.year}",
            data={
                "base_price": base_price,
            },
            confidence=0.85
        )
        
        # Step 2: Calculate adjustments
        adjustments: List[AdjustmentDetail] = []
        running_total = base_price
        
        # Condition adjustment
        condition_multiplier = CONDITION_MULTIPLIERS.get(vehicle.condition, 1.0)
        condition_adjustment = base_price * (condition_multiplier - 1)
        if condition_adjustment != 0:
            adjustments.append(AdjustmentDetail(
                factor=f"État: {vehicle.condition}",
                amount=condition_adjustment,
                percentage=(condition_multiplier - 1) * 100,
                reasoning=f"État du véhicule {vehicle.condition.lower()} applique un coefficient de {condition_multiplier}"
            ))
            running_total += condition_adjustment
        
        # Mileage adjustment
        mileage_adj, mileage_reason = self._calculate_mileage_adjustment(
            vehicle.mileage, base_price, vehicle.year
        )
        if mileage_adj != 0:
            adjustments.append(AdjustmentDetail(
                factor="Kilométrage",
                amount=mileage_adj,
                percentage=(mileage_adj / base_price) * 100,
                reasoning=mileage_reason
            ))
            running_total += mileage_adj
        
        # Service history bonus
        if vehicle.service_history:
            service_bonus = base_price * 0.03
            adjustments.append(AdjustmentDetail(
                factor="Historique d'entretien complet",
                amount=service_bonus,
                percentage=3.0,
                reasoning="Entretien régulier et documenté augmente la valeur et la fiabilité"
            ))
            running_total += service_bonus
        
        # No accidents bonus
        if not vehicle.accidents:
            no_accident_bonus = base_price * 0.02
            adjustments.append(AdjustmentDetail(
                factor="Aucun accident déclaré",
                amount=no_accident_bonus,
                percentage=2.0 ,
                reasoning="Véhicule sans historique d'accident augmente la confiance et la valeur"
            ))
            running_total += no_accident_bonus
        
        self._log_step(
            action="Calcul des ajustements",
            reasoning=f"Appliqué {len(adjustments)} ajustements",
            data={"adjustments_count": len(adjustments), "total_adjustment": running_total - base_price},
            confidence=0.90
        )
        
        # Step 3: Get LLM insights (Async)
        llm_analysis = await self._generate_llm_analysis(vehicle_dict, base_price)
        
        self._log_step(
            action="Analyse qualitative IA",
            reasoning="Analyse contextuelle du marché",
            data={"analysis": llm_analysis},
            confidence=0.75
        )
        
        # Step 4: Calculate final value and range
        final_value = round(running_total, -2)  # Round to nearest 100
        min_value = round(final_value * 0.94, -2)
        max_value = round(final_value * 1.06, -2)
        
        overall_confidence = 0.87 if len(adjustments) >= 2 else 0.75
        
        self._log_step(
            action="Finalisation de l'évaluation",
            reasoning=f"Valeur calculée: {final_value} MAD",
            data={"final_value": final_value, "min": min_value, "max": max_value},
            confidence=overall_confidence
        )
        
        breakdown = ValuationBreakdownModel(
            base_price=base_price,
            adjustments=adjustments,
            market_comparables=0, 
            confidence=overall_confidence,
            final_value=final_value
        )
        
        explanation = f"""Évaluation IA:
AS: {base_price:,.0f} MAD
Ajustements: {len(adjustments)}
Valeur finale: {final_value:,.0f} MAD
{llm_analysis}"""
        
        return ValuationResponseModel(
            trade_in_id=request.trade_in_id,
            estimated_value=final_value,
            value_range={"min": min_value, "max": max_value},
            breakdown=breakdown,
            market_analysis={
                "demand_level": "medium", # Can come from service later
                "comparables_found": 0,
                "market_average": base_price,
                "position": "competitive"
            },
            confidence=overall_confidence,
            explanation=explanation,
            agent_steps=self.agent_steps
        )

# Singleton instance
valuation_agent = ValuationAgent()
