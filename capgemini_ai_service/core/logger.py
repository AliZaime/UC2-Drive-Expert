import structlog
import logging
import sys

def configure_logger():
    """
    Configure structlog for JSON output in production and pretty console in dev.
    """
    
    # Simple Toggle for now (could be env var)
    JSON_LOGS = False 
    
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
    ]

    if JSON_LOGS:
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]
    else:
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(),
        ]

    structlog.configure(
        processors=processors,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Wrap standard python logging to also use structlog
    # (Optional, but good if libs use standard logging)
    
configure_logger()
logger = structlog.get_logger()
