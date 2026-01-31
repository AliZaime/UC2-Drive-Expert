"""
Groq LLM Adapter
Implements BaseLLM interface using Groq's ultra-fast inference API.
"""
import json
import asyncio
from typing import Any, Dict, List, Optional, Type, TypeVar
from dataclasses import dataclass, field

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel

from src.infrastructure.llm.base import BaseLLM, LLMResponse
from config.settings import settings

T = TypeVar("T", bound=BaseModel)


@dataclass
class UsageTracker:
    """Track cumulative token usage"""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_requests: int = 0
    
    def add(self, prompt: int, completion: int):
        self.prompt_tokens += prompt
        self.completion_tokens += completion
        self.total_requests += 1


class GroqAdapter(BaseLLM):
    """
    Groq-specific LLM implementation.
    
    Features:
    - Ultra-fast inference (Groq's specialized hardware)
    - Automatic retry with exponential backoff
    - Token usage tracking
    - Structured output parsing
    
    Models available:
    - llama-3.3-70b-versatile (default)
    - mixtral-8x7b-32768
    - llama-3.1-8b-instant
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        max_retries: int = 3,
    ):
        self._api_key = api_key or settings.groq_api_key
        self._model_name = model_name or settings.default_model
        self._temperature = temperature
        self._max_tokens = max_tokens
        self._max_retries = max_retries
        self._usage = UsageTracker()
        
        # Initialize LangChain ChatGroq
        self._client = ChatGroq(
            groq_api_key=self._api_key,
            model_name=self._model_name,
            temperature=self._temperature,
            max_tokens=self._max_tokens,
        )
    
    @property
    def model_name(self) -> str:
        return self._model_name
    
    async def invoke(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """Send prompt and get raw text response"""
        messages = []
        
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        messages.append(HumanMessage(content=prompt))
        
        # Apply overrides if provided
        client = self._get_client_with_overrides(temperature, max_tokens)
        
        response = await self._invoke_with_retry(client, messages)
        
        # Track usage (estimate if not provided)
        usage = self._extract_usage(response)
        self._usage.add(usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0))
        
        return LLMResponse(
            content=response.content,
            model=self._model_name,
            usage=usage,
            metadata={"provider": "groq"}
        )
    
    async def invoke_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> T:
        """Send prompt and parse into Pydantic model"""
        parser = JsonOutputParser(pydantic_object=response_schema)
        format_instructions = parser.get_format_instructions()
        
        enhanced_prompt = f"{prompt}\n\n{format_instructions}"
        
        response = await self.invoke(
            prompt=enhanced_prompt,
            system_prompt=system_prompt,
            temperature=temperature or 0.3,  # Lower temp for structured output
        )
        
        # Parse JSON from response
        try:
            parsed = parser.parse(response.content)
            return response_schema(**parsed) if isinstance(parsed, dict) else parsed
        except Exception as e:
            # Try to extract JSON from response
            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            parsed = json.loads(content)
            return response_schema(**parsed)
    
    async def invoke_chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> LLMResponse:
        """Send multi-turn conversation"""
        langchain_messages = []
        
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if role == "system":
                langchain_messages.append(SystemMessage(content=content))
            elif role == "assistant":
                langchain_messages.append(AIMessage(content=content))
            else:
                langchain_messages.append(HumanMessage(content=content))
        
        client = self._get_client_with_overrides(temperature, max_tokens)
        response = await self._invoke_with_retry(client, langchain_messages)
        
        usage = self._extract_usage(response)
        self._usage.add(usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0))
        
        return LLMResponse(
            content=response.content,
            model=self._model_name,
            usage=usage,
            metadata={"provider": "groq"}
        )
    
    def get_usage_stats(self) -> Dict[str, int]:
        """Get cumulative token usage"""
        return {
            "total_prompt_tokens": self._usage.prompt_tokens,
            "total_completion_tokens": self._usage.completion_tokens,
            "total_requests": self._usage.total_requests,
        }
    
    def _get_client_with_overrides(
        self,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> ChatGroq:
        """Create client with optional parameter overrides"""
        if temperature is None and max_tokens is None:
            return self._client
        
        return ChatGroq(
            groq_api_key=self._api_key,
            model_name=self._model_name,
            temperature=temperature or self._temperature,
            max_tokens=max_tokens or self._max_tokens,
        )
    
    async def _invoke_with_retry(self, client: ChatGroq, messages: list) -> Any:
        """Invoke with exponential backoff retry"""
        last_error = None
        
        for attempt in range(self._max_retries):
            try:
                return await client.ainvoke(messages)
            except Exception as e:
                last_error = e
                if attempt < self._max_retries - 1:
                    wait_time = (2 ** attempt) * 0.5  # 0.5s, 1s, 2s
                    await asyncio.sleep(wait_time)
        
        raise last_error
    
    def _extract_usage(self, response: Any) -> Dict[str, int]:
        """Extract token usage from response"""
        try:
            if hasattr(response, "response_metadata"):
                meta = response.response_metadata
                if "token_usage" in meta:
                    return meta["token_usage"]
                if "usage" in meta:
                    return meta["usage"]
        except Exception:
            pass
        
        # Estimate based on content length if not available
        content_len = len(response.content) if hasattr(response, "content") else 0
        return {
            "prompt_tokens": 0,
            "completion_tokens": content_len // 4,  # Rough estimate
            "total_tokens": content_len // 4,
        }


# Factory function for dependency injection
def get_groq_llm() -> GroqAdapter:
    """Get configured Groq LLM instance"""
    return GroqAdapter(
        api_key=settings.groq_api_key,
        model_name=settings.default_model,
        temperature=settings.temperature,
        max_tokens=settings.max_tokens,
    )
