"""
Orchestration Flow
Wraps the existing OrchestratorAgent with dependency injection.

Uses LangGraph to coordinate between:
- ProfileAgent: Build customer psychographic profile
- ValuationAgent: Evaluate trade-in vehicle
- InventoryAgent: Find matching vehicles
- DealAgent: Structure financing options
- NegotiationAgent: Handle price negotiation
"""
from typing import Dict, Any, Optional


class OrchestrationFlow:
    """
    Service orchestrating the multi-agent workflow.
    
    Wraps existing OrchestratorAgent with DI support.
    """
    
    def __init__(
        self,
        negotiation_service=None,
        valuation_service=None,
        profiling_service=None,
        inventory_service=None,
        deal_service=None,
    ):
        self.negotiation_service = negotiation_service
        self.valuation_service = valuation_service
        self.profiling_service = profiling_service
        self.inventory_service = inventory_service
        self.deal_service = deal_service
        
        self._agent = None
    
    def _get_agent(self):
        """Lazy load legacy agent"""
        if self._agent is None:
            from agents.orchestrator_agent import OrchestratorAgent
            self._agent = OrchestratorAgent()
        return self._agent
    
    async def run_flow(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run the complete orchestration flow.
        
        Request should contain:
        - session_id: str
        - customer_message: str
        - trade_in_data: Optional[dict]
        - customer_preferences: Optional[dict]
        """
        agent = self._get_agent()
        result = await agent.run_flow(request)
        return result
    
    async def run_profiling(self, conversation: list, preferences: dict) -> Dict[str, Any]:
        """Run just the profiling step"""
        if self.profiling_service:
            return await self.profiling_service.analyze_profile(conversation, preferences)
        
        agent = self._get_agent()
        # Call profiling node directly
        from agents.profiling.agent import profiling_agent
        return await profiling_agent.analyze_profile(conversation, preferences)
    
    async def run_valuation(self, vehicle_data: dict) -> Dict[str, Any]:
        """Run just the valuation step"""
        if self.valuation_service:
            return await self.valuation_service.valuate(vehicle_data)
        
        from agents.valuation_agent import valuation_agent
        return await valuation_agent.valuate(vehicle_data)
    
    async def run_inventory_matching(self, profile: dict) -> Dict[str, Any]:
        """Run just the inventory matching step"""
        if self.inventory_service:
            return await self.inventory_service.find_matches(profile)
        
        from agents.inventory_agent import inventory_agent
        return await inventory_agent.find_matches(profile)
    
    async def run_deal_structuring(
        self,
        vehicle_price: float,
        trade_in_value: float,
        customer_budget: float,
    ) -> Dict[str, Any]:
        """Run just the deal structuring step"""
        if self.deal_service:
            return await self.deal_service.structure_deal(
                vehicle_price=vehicle_price,
                trade_in_value=trade_in_value,
                customer_budget=customer_budget,
            )
        
        from agents.deal_agent import deal_agent
        return await deal_agent.structure_deal(
            vehicle_price=vehicle_price,
            trade_in_value=trade_in_value,
            customer_budget=customer_budget,
        )
