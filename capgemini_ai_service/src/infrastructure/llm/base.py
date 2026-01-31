"""
Abstract LLM Interface
Provides a provider-agnostic interface for LLM operations.
Enables easy switching between Groq, OpenAI, Anthropic, local models, etc.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


@dataclass
class LLMResponse:
    """Standardized response from any LLM provider"""
    content: str
    model: str
    usage: Dict[str, int]  # {prompt_tokens, completion_tokens, total_tokens}
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class BaseLLM(ABC):
    """
    Abstract base class for LLM providers.
    
    All LLM implementations should:
    1. Handle retries and rate limiting internally
    2. Provide consistent error handling
    3. Track token usage for monitoring
    
    Example usage:
        llm = GroqAdapter(api_key="...")
        response = await llm.invoke("Hello, world!")
        parsed = await llm.invoke_structured(prompt, MyPydanticModel)
    """
    
    @property
    @abstractmethod
    def model_name(self) -> str:
        """Return the current model name"""
        pass
    
    @abstractmethod
    async def invoke(
        self, 
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """
        Send a prompt to the LLM and get a raw text response.
        
        Args:
            prompt: The user/human message
            system_prompt: Optional system message for context
            temperature: Override default temperature (0.0-1.0)
            max_tokens: Override default max tokens
            
        Returns:
            LLMResponse with content and metadata
        """
        pass
    
    @abstractmethod
    async def invoke_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> T:
        """
        Send a prompt and parse response into a Pydantic model.
        
        Uses JSON mode or structured output when available.
        Falls back to prompt engineering + parsing.
        
        Args:
            prompt: The user/human message
            response_schema: Pydantic model class to parse into
            system_prompt: Optional system message
            temperature: Override default temperature
            
        Returns:
            Parsed Pydantic model instance
        """
        pass
    
    @abstractmethod
    async def invoke_chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """
        Send a multi-turn conversation to the LLM.
        
        Args:
            messages: List of {"role": "user|assistant|system", "content": "..."}
            temperature: Override default temperature
            max_tokens: Override default max tokens
            
        Returns:
            LLMResponse with assistant's reply
        """
        pass
    
    def get_usage_stats(self) -> Dict[str, int]:
        """
        Get cumulative token usage stats for this session.
        Useful for monitoring and cost tracking.
        """
        return {
            "total_prompt_tokens": 0,
            "total_completion_tokens": 0,
            "total_requests": 0,
        }
