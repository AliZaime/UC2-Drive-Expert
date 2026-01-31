from typing import Dict, Any, List, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END

from schemas.types import NegotiationState, AgentStep
from agents.profiling.agent import profiling_agent
from agents.valuation_agent import valuation_agent
from agents.inventory_agent import inventory_agent
from agents.deal_agent import deal_agent
from core.metrics import WinWinCalculator
from core.session_store import get_session_store, NegotiationSession

import datetime

class OrchestratorAgent:
    def __init__(self):
        self.workflow = self._build_graph()
        self.app = self.workflow.compile()
        
    def _build_graph(self):
        """Define the LangGraph workflow with feedback loops"""
        workflow = StateGraph(NegotiationState)
        
        # Define Nodes
        workflow.add_node("profile_customer", self._profiling_node)
        workflow.add_node("valuate_vehicle", self._valuation_node)
        workflow.add_node("match_inventory", self._inventory_node)
        workflow.add_node("structure_deal", self._deal_node)
        workflow.add_node("initialize_session", self._init_session_node)
        
        # Define Edges
        workflow.set_entry_point("profile_customer")
        
        # Logic: Always profile -> Then check if trade-in needed
        workflow.add_conditional_edges(
            "profile_customer",
            self._check_trade_in,
            {
                "has_trade_in": "valuate_vehicle",
                "no_trade_in": "match_inventory"
            }
        )
        
        # If valuated, go to matching
        workflow.add_edge("valuate_vehicle", "match_inventory")
        
        # After matching, structure the deal
        workflow.add_edge("match_inventory", "structure_deal")
        
        # FEEDBACK LOOP: From deal, check if customer wants different car
        workflow.add_conditional_edges(
            "structure_deal",
            self._check_deal_satisfaction,
            {
                "satisfied": "initialize_session",
                "wants_different": "match_inventory",  # Loop back!
                "needs_more_info": "profile_customer"  # Re-profile if needed
            }
        )
        
        workflow.add_edge("initialize_session", END)
        
        return workflow

    # --- Node Functions ---
    
    async def _profiling_node(self, state: NegotiationState) -> Dict[str, Any]:
        """Analyze customer profile"""
        print("--- Node: Profiling ---")
        history = state.get("conversation_history", [])
        prefs = state.get("customer_preferences", {})
        
        profile = await profiling_agent.analyze_profile(history, prefs)
        
        step = AgentStep(
            agent_name="Profiling Agent",
            action="Analyze Psychographics",
            reasoning=f"Identified segment: {profile.get('segment')}",
            data=profile,
            confidence=profile.get('confidence_score', 0.8),
            timestamp=datetime.datetime.now()
        )
        
        # Accumulate steps properly
        existing_steps = list(state.get("agent_steps", []))
        existing_steps.append(step)
        
        return {
            "customer_profile": profile,
            "agent_steps": existing_steps
        }

    async def _valuation_node(self, state: NegotiationState) -> Dict[str, Any]:
        """Valuate trade-in if exists"""
        trade_in_id = state.get("trade_in_id")
        if not trade_in_id:
            print("--- Node: Valuation Skipped (No ID) ---")
            return {}

        print(f"--- Node: Valuating Trade-In {trade_in_id} ---")
        
        # Construct Request
        from schemas.models import ValuationRequestModel, VehicleData
        
        # Ensure trade_in_data matches VehicleData schema
        raw_data = state.get("trade_in_data", {})
        vehicle_data = VehicleData(**raw_data)
        
        req = ValuationRequestModel(
            trade_in_id=str(trade_in_id),
            vehicle=vehicle_data,
            photos=[]
        )
        
        # CALL REAL AGENT
        result = await valuation_agent.valuate(req)
        
        # Accumulate steps properly
        existing_steps = list(state.get("agent_steps", []))
        existing_steps.extend(result.agent_steps)
        
        # Convert pydantic model to dict for state
        return {
            "valuation_result": result.model_dump(),
            "agent_steps": existing_steps
        }

    async def _inventory_node(self, state: NegotiationState) -> Dict[str, Any]:
        """Match inventory to profile"""
        print("--- Node: Inventory Matching ---")
        profile = state.get("customer_profile", {})
        
        # Use real inventory (pass None)
        matches = await inventory_agent.find_matches(profile, None)
        
        step = AgentStep(
            agent_name="Inventory Agent",
            action="Match Vehicles",
            reasoning=f"Found {len(matches.get('matches', []))} suitable vehicles in real inventory",
            data=matches,
            confidence=0.9,
            timestamp=datetime.datetime.now()
        )
        
        # Accumulate steps properly
        existing_steps = list(state.get("agent_steps", []))
        existing_steps.append(step)
        
        return {
            "vehicle_matches": matches.get('matches', []),
            "agent_steps": existing_steps
        }
        
    async def _deal_node(self, state: NegotiationState) -> Dict[str, Any]:
        """Structure the deal"""
        print("--- Node: Deal Structuring ---")
        matches = state.get("vehicle_matches", [])
        if not matches:
             return {}
             
        # matches is a list of dicts (from Pydantic model dump)
        top_match = matches[0]
        top_vehicle_id = top_match.get('vehicle_id')
        
        # Get REAL price from the match
        price = top_match.get('price', 200000.0) 
        
        trade_in_val = state.get("valuation_result", {}).get("estimated_value", 0)
        profile = state.get("customer_profile", {})
        
        # Call Deal Agent
        deal = await deal_agent.structure_deal(price, trade_in_val, profile)
        
        step = AgentStep(
            agent_name="Deal Agent",
            action="Structure Financing",
            reasoning=f"Created {len(deal.get('options', []))} options for {top_match.get('make')} {top_match.get('model')} (Price: {price})",
            data=deal,
            confidence=0.85,
            timestamp=datetime.datetime.now()
        )
        
        # Accumulate steps properly
        existing_steps = list(state.get("agent_steps", []))
        existing_steps.append(step)
        
        return {
            "deal_options": deal.get('options', []),
            "agent_steps": existing_steps
        }
    
    def _init_session_node(self, state: NegotiationState) -> Dict[str, Any]:
        """Prepare final state and calculate win-win score"""
        print("--- Node: Session Init ---")
        
        # Calculate Win-Win Score
        deal_options = state.get("deal_options", [])
        vehicle_matches = state.get("vehicle_matches", [])
        valuation = state.get("valuation_result", {})
        profile = state.get("customer_profile", {})
        
        win_win_score = 0.0
        
        if deal_options and vehicle_matches:
            top_vehicle = vehicle_matches[0] if vehicle_matches else {}
            top_deal = deal_options[0] if deal_options else {}
            
            # Get vehicle cost (from inventory data or estimate)
            vehicle_price = top_vehicle.get("price", 0)
            vehicle_cost = vehicle_price * 0.85  # Estimate 15% margin if not available
            
            trade_in_value = valuation.get("estimated_value", 0)
            monthly = top_deal.get("monthly_payment", 0)
            duration = top_deal.get("duration_months", 60)
            customer_budget = profile.get("monthly_budget", monthly * 1.2)
            
            if monthly > 0 and vehicle_cost > 0:
                win_win_result = WinWinCalculator.estimate_from_monthly(
                    monthly_payment=monthly,
                    duration_months=duration,
                    vehicle_cost=vehicle_cost,
                    trade_in_value=trade_in_value,
                    customer_budget=customer_budget,
                    customer_emotion_score=0.3  # Default neutral-positive for new session
                )
                win_win_score = win_win_result.get("win_win_score", 0)
        
        # Build context objects for seamless negotiate handoff
        vehicle_context = None
        trade_in_context = None
        
        if vehicle_matches:
            top = vehicle_matches[0]
            vehicle_context = {
                "vehicle_id": top.get("vehicle_id"),
                "price": top.get("price", 0),
                "cost": top.get("price", 0) * 0.85,
                "make": top.get("make"),
                "model": top.get("model")
            }
        
        if valuation.get("estimated_value"):
            trade_in_context = {
                "trade_in_id": state.get("trade_in_id"),
                "value": valuation.get("estimated_value", 0)
            }
        
        return {
            "status": "ready_for_negotiation",
            "win_win_score": win_win_score,
            # Context for UI to pass to /ai/negotiate
            "vehicle_context": vehicle_context,
            "trade_in_context": trade_in_context,
            "profile_context": profile
        }

    # --- Edge Conditions ---
    
    def _check_trade_in(self, state: NegotiationState) -> str:
        if state.get("trade_in_id"):
            return "has_trade_in"
        return "no_trade_in"

    def _check_deal_satisfaction(self, state: NegotiationState) -> str:
        """
        Check if user is satisfied with the deal or wants to loop back.
        This is the callback for the cyclic workflow edge.
        
        In a real implementation, this would check:
        - User's explicit feedback ("I want a different car")
        - Rejection count
        - Emotional trend (declining = maybe needs different option)
        
        For now, we default to 'satisfied' to proceed. The real logic
        would be updated during negotiation phase when user provides feedback.
        """
        # Check for explicit loop-back signals in state
        loop_back_signal = state.get("loop_back_to")
        
        if loop_back_signal == "inventory":
            return "wants_different"
        elif loop_back_signal == "profile":
            return "needs_more_info"
        
        # Default: proceed to finalization
        return "satisfied"

    # --- Public API ---
    
    async def run_flow(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Run the full graph and return enriched response"""
        # Initialize default state
        initial_state = NegotiationState(
            session_id=inputs.get("session_id", "new"),
            customer_id=inputs.get("customer_id", "anon"),
            trade_in_id=inputs.get("trade_in_id"),
            customer_preferences=inputs.get("preferences", {}),
            trade_in_data=inputs.get("trade_in_data", {}), # Needed for valuation
            conversation_history=[],
            agent_steps=[]
        )
        
        # Invoke graph
        final_state = await self.app.ainvoke(initial_state)
        
        # Enrich response with negotiation-ready context
        response = dict(final_state)
        response["session_id"] = inputs.get("session_id", "new")
        response["customer_id"] = inputs.get("customer_id", "anon")
        
        return response

# Singleton
orchestrator_agent = OrchestratorAgent()
