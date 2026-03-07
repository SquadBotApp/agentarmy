"""
Redis State Manager for Multi-Agent System
Provides shared state across all SpaceOS agents via Redis.
"""

import os
import json
import logging
from typing import Any, Optional, Dict
from datetime import datetime

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, using in-memory fallback")


class RedisStateManager:
    """Manages shared state across all agents using Redis."""
    
    def __init__(self, namespace: str = "spaceos"):
        self.namespace = namespace
        self._redis_client = None
        self._memory_store = {}
        
        if REDIS_AVAILABLE:
            try:
                self._redis_client = redis.from_url(REDIS_URL, decode_responses=True)
                self._redis_client.ping()
                logger.info(f"Connected to Redis at {REDIS_URL}")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}, using in-memory store")
                self._redis_client = None
    
    def _make_key(self, key: str) -> str:
        return f"{self.namespace}:{key}"
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        try:
            serialized = json.dumps(value, default=str)
            full_key = self._make_key(key)
            
            if self._redis_client:
                self._redis_client.setex(full_key, ttl, serialized)
            else:
                self._memory_store[full_key] = {
                    "value": serialized,
                    "expires": datetime.now().timestamp() + ttl
                }
            return True
        except Exception as e:
            logger.error(f"Failed to set {key}: {e}")
            return False
    
    def get(self, key: str, default: Any = None) -> Any:
        try:
            full_key = self._make_key(key)
            
            if self._redis_client:
                value = self._redis_client.get(full_key)
                if value is None:
                    return default
                return json.loads(value)
            else:
                if full_key in self._memory_store:
                    entry = self._memory_store[full_key]
                    if entry.get("expires", 0) > datetime.now().timestamp():
                        return json.loads(entry["value"])
                    else:
                        del self._memory_store[full_key]
                return default
        except Exception as e:
            logger.error(f"Failed to get {key}: {e}")
            return default
    
    def publish_agent_update(self, agent_name: str, state: Dict[str, Any]) -> bool:
        return self.set(f"agent:{agent_name}", state)
    
    def get_agent_state(self, agent_name: str) -> Optional[Dict[str, Any]]:
        return self.get(f"agent:{agent_name}")
    
    def set_telemetry(self, station: str, telemetry: Dict[str, Any]) -> bool:
        return self.set(f"telemetry:{station}", telemetry)
    
    def get_telemetry(self, station: str) -> Optional[Dict[str, Any]]:
        return self.get(f"telemetry:{station}")
    
    def ping(self) -> bool:
        if self._redis_client:
            try:
                self._redis_client.ping()
                return True
            except:
                return False
        return not REDIS_AVAILABLE


_state_manager: Optional[RedisStateManager] = None

def get_state_manager() -> RedisStateManager:
    global _state_manager
    if _state_manager is None:
        _state_manager = RedisStateManager()
    return _state_manager
