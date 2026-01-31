"""
FastAPI Application Entry Point
Google-Level Architecture with Clean Separation of Concerns

This is the NEW entry point for the refactored architecture.
Run with: uvicorn src.interfaces.fast_api.main:app --reload --port 8001

The original main.py in the root is kept for backward compatibility.
"""
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config.settings import settings
from src.infrastructure.logging.structured import configure_logging, get_logger

# Import route modules
from src.interfaces.fast_api.routes import health, negotiate, valuate, orchestrate


# ============ Lifespan (Startup/Shutdown) ============

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Application lifespan handler.
    
    Startup: Initialize logging, validate config
    Shutdown: Cleanup resources
    """
    # Startup
    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    configure_logging(
        level=os.getenv("LOG_LEVEL", "INFO"),
        json_format=is_production,
        service_name="ai-negotiation-service",
    )
    
    logger = get_logger("startup")
    logger.info(
        "starting_service",
        model=settings.default_model,
        host=settings.host,
        port=settings.port,
    )
    
    yield
    
    # Shutdown
    logger.info("shutting_down_service")


# ============ Create App ============

app = FastAPI(
    title="AI Negotiation Service",
    description="""
    Multi-Agent AI System for Autonomous Vehicle Negotiation with Emotional Intelligence.
    
    ## Features
    - **Emotional Intelligence**: Detects customer emotions and adapts responses
    - **Multi-Language Support**: French, English, Arabic, Moroccan Darija
    - **Explainable AI**: Transparent reasoning for all decisions
    - **Win-Win Optimization**: Balances customer satisfaction and dealer profitability
    
    ## Agents
    - **Profiling Agent**: Builds psychographic customer profiles
    - **Valuation Agent**: Provides transparent trade-in valuations
    - **Inventory Agent**: Matches vehicles to customer needs
    - **Deal Agent**: Structures financing options
    - **Negotiation Agent**: Handles price negotiation with empathy
    - **Orchestrator**: Coordinates all agents into workflow
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ============ Middleware ============

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    logger = get_logger("http")
    
    logger.info(
        "request_received",
        method=request.method,
        path=request.url.path,
    )
    
    response = await call_next(request)
    
    logger.info(
        "request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
    )
    
    return response


# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions"""
    logger = get_logger("error")
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        error=str(exc),
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG") else "An unexpected error occurred",
        }
    )


# ============ Register Routes ============

app.include_router(health.router)
app.include_router(negotiate.router)
app.include_router(valuate.router)
app.include_router(orchestrate.router)


# ============ Root Endpoint ============

@app.get("/")
async def root():
    """API root - returns service info"""
    return {
        "service": "AI Negotiation Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# ============ Server Startup ============

def start_server():
    """Start server programmatically"""
    import uvicorn
    uvicorn.run(
        "src.interfaces.fast_api.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )


if __name__ == "__main__":
    start_server()
