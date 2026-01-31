"""
Structured Logging Configuration
JSON-formatted logs for production observability.
"""
import sys
import logging
from typing import Any, Dict, Optional

import structlog
from structlog.types import Processor


def configure_logging(
    level: str = "INFO",
    json_format: bool = True,
    service_name: str = "ai-negotiation-service",
) -> None:
    """
    Configure structured logging for the application.
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR)
        json_format: If True, output JSON logs (production). If False, pretty print (dev).
        service_name: Service name to include in all logs
    """
    # Shared processors
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]
    
    if json_format:
        # Production: JSON output
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
    else:
        # Development: Pretty console output
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, level.upper())
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Also configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, level.upper()),
    )


def get_logger(name: str = None, **initial_context: Any) -> structlog.BoundLogger:
    """
    Get a structured logger instance.
    
    Args:
        name: Logger name (usually module name)
        **initial_context: Initial context to bind to all log messages
    
    Returns:
        Configured structlog logger
        
    Example:
        logger = get_logger("negotiation", session_id="123")
        logger.info("starting_negotiation", customer_id="456")
        # Output: {"event": "starting_negotiation", "session_id": "123", "customer_id": "456", ...}
    """
    logger = structlog.get_logger(name)
    
    if initial_context:
        logger = logger.bind(**initial_context)
    
    return logger


class LoggingContext:
    """
    Context manager for adding temporary logging context.
    
    Example:
        with LoggingContext(request_id="abc123"):
            logger.info("processing")  # Includes request_id
        logger.info("done")  # No request_id
    """
    
    def __init__(self, **context: Any):
        self.context = context
        self._token = None
    
    def __enter__(self):
        self._token = structlog.contextvars.bind_contextvars(**self.context)
        return self
    
    def __exit__(self, *args):
        if self._token:
            structlog.contextvars.unbind_contextvars(*self.context.keys())


# Initialize with defaults
configure_logging(json_format=False)  # Dev mode by default
