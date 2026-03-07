"""
Telemetry Analyzer Node
Uses LLM to analyze telemetry data, detect anomalies, and propose actions.
Supports multiple LLM providers: Google AI (Gemini), OpenRouter, Groq, xAI, OpenAI, Anthropic.

Improvements:
- LLM client caching (singleton pattern)
- Robust JSON parsing with regex extraction
- Retry logic for LLM calls
- Comprehensive error handling
"""

import json
import os
import re
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime
from functools import lru_cache
from langchain_core.language_models import BaseChatModel
from langchain_core.outputs import ChatResult

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# LLM Client Caching (Singleton Pattern)
# ============================================================================

# Global cached LLM client
_llm_client: Optional[BaseChatModel] = None


def get_llm_client() -> Optional[BaseChatModel]:
    """
    Get the configured LLM client based on available API keys.
    Uses singleton pattern to avoid re-initializing on every call.
    
    Supported providers (in priority order):
    1. Google AI Studio (Gemini) - No rate limits, free tier
    2. OpenRouter - Access to 50+ models (DeepSeek, Qwen, Kimi, etc.)
    3. Groq - Lightning-fast inference for Llama, Mistral, DeepSeek
    4. xAI Grok - Fast reasoning model
    5. OpenAI GPT-4o - Top-tier models
    6. Anthropic Claude - Best for complex reasoning
    
    Returns:
        Configured LLM client or None if no API keys available
    """
    global _llm_client
    
    # Return cached client if already initialized
    if _llm_client is not None:
        return _llm_client
    
    # 1. Try Google AI Studio (Gemini) - Recommended for free tier
    if os.getenv("GOOGLE_API_KEY"):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            _llm_client = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                temperature=0,
                google_api_key=os.getenv("GOOGLE_API_KEY")
            )
            logger.info("Using Google AI (Gemini) as LLM provider")
            return _llm_client
        except ImportError as e:
            logger.warning(f"Google AI not available: {e}")
        except Exception as e:
            logger.warning(f"Failed to initialize Google AI: {e}")
    
    # 2. Try OpenRouter - Access to 50+ models
    if os.getenv("OPENROUTER_API_KEY"):
        try:
            from langchain_openai import ChatOpenAI
            _llm_client = ChatOpenAI(
                model="openrouter/ai/qwen/qwen2.5-72b-instruct",
                temperature=0,
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url="https://openrouter.ai/v1"
            )
            logger.info("Using OpenRouter (Qwen) as LLM provider")
            return _llm_client
        except ImportError as e:
            logger.warning(f"OpenAI not available: {e}")
        except Exception as e:
            logger.warning(f"Failed to initialize OpenRouter: {e}")
    
    # 3. Try Groq - Lightning-fast inference
    if os.getenv("GROQ_API_KEY"):
        try:
            from langchain_groq import ChatGroq
            model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
            _llm_client = ChatGroq(model=model, temperature=0, groq_api_key=os.getenv("GROQ_API_KEY"))
            logger.info(f"Using Groq ({model}) as LLM provider")
            return _llm_client
        except ImportError as e:
            logger.warning(f"Groq not available: {e}")
        except Exception as e:
            logger.warning(f"Failed to initialize Groq: {e}")
    
    # 4. Try xAI Grok
    if os.getenv("GROK_API_KEY"):
        try:
            from langchain_xai import ChatXAI
            _llm_client = ChatXAI(model="grok-beta", temperature=0, xai_api_key=os.getenv("GROK_API_KEY"))
            logger.info("Using xAI (Grok) as LLM provider")
            return _llm_client
        except ImportError as e:
            logger.warning(f"xAI not available: {e}")
        except Exception as e:
            logger.warning(f"Failed to initialize xAI: {e}")
    
    # 5. Try OpenAI
    if os.getenv("OPENAI_API_KEY"):
        try:
            from langchain_openai import ChatOpenAI
            _llm_client = ChatOpenAI(model="gpt-4o", temperature=0, api_key=os.getenv("OPENAI_API_KEY"))
            logger.info("Using OpenAI (GPT-4o) as LLM provider")
            return _llm_client
        except ImportError as e:
            logger.warning(f"OpenAI not available: {e}")
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI: {e}")
    
    # 6. Try Anthropic
    if os.getenv("ANTHROPIC_API_KEY"):
        try:
            from langchain_anthropic import ChatAnthropic
            _llm_client = ChatAnthropic(
                model="claude-sonnet-4-20250514", 
                temperature=0, 
                anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
            )
            logger.info("Using Anthropic (Claude) as LLM provider")
            return _llm_client
        except ImportError as e:
            logger.warning(f"Anthropic not available: {e}")
        except Exception as e:
            logger.warning(f"Failed to initialize Anthropic: {e}")
    
    # No client available
    logger.warning("No LLM provider available - will use rule-based analysis")
    return None


def reset_llm_client() -> None:
    """Reset the cached LLM client. Useful for testing or when API keys change."""
    global _llm_client
    _llm_client = None
    logger.info("LLM client cache reset")


# ============================================================================
# JSON Parsing Utilities
# ============================================================================

def extract_json_from_response(response_content: str) -> Optional[Dict[str, Any]]:
    """
    Robustly extract JSON from LLM response.
    Tries multiple strategies:
    1. Direct parse
    2. Find JSON in markdown code blocks
    3. Regex extract JSON object
    
    Args:
        response_content: Raw string response from LLM
        
    Returns:
        Parsed JSON dict or None if extraction fails
    """
    if not response_content:
        return None
    
    # Strategy 1: Try direct parsing
    try:
        return json.loads(response_content.strip())
    except json.JSONDecodeError:
        pass
    
    # Strategy 2: Extract from markdown code blocks
    json_block_pattern = r'```(?:json)?\s*(\{.*?\})\s*```'
    match = re.search(json_block_pattern, response_content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Strategy 3: Find first { to last } (balanced)
    start_idx = response_content.find('{')
    if start_idx != -1:
        # Find matching closing brace
        depth = 0
        for i, char in enumerate(response_content[start_idx:], start_idx):
            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(response_content[start_idx:i+1])
                    except json.JSONDecodeError:
                        break
    
    # All strategies failed
    logger.error(f"Failed to extract JSON from response: {response_content[:200]}...")
    return None


# ============================================================================
# Retry Logic
# ============================================================================

def retry_with_backoff(
    func: Callable, 
    max_retries: int = 3, 
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0
) -> Any:
    """
    Execute a function with exponential backoff retry logic.
    
    Args:
        func: Function to execute
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        backoff_factor: Multiplier for delay after each retry
        
    Returns:
        Result of successful function call
        
    Raises:
        Last exception if all retries fail
    """
    delay = initial_delay
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            last_exception = e
            if attempt < max_retries - 1:
                logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
                import time
                time.sleep(delay)
                delay *= backoff_factor
            else:
                logger.error(f"All {max_retries} attempts failed")
    
    raise last_exception


# ============================================================================
# Analysis Prompt
# ============================================================================

# Analysis prompt for space station AI
ANALYSIS_PROMPT = """You are a commercial space station AI safety system. Your job is to analyze telemetry data from a private space station (like Vast's Haven-1, Axiom, or Starlab) and detect any anomalies that could endanger the station or crew.

Analyze the following telemetry data:
{telemetry}

CRITICAL RULES:
1. You MUST be conservative - flag anything unusual
2. Space is unforgiving - one mistake can destroy a $100M+ asset
3. Consider crew safety as the highest priority
4. Think about cascading failures (e.g., power drop → thermal issues → life support failure)

Output ONLY valid JSON with this exact structure:
{{
    "anomaly_detected": true or false,
    "anomaly_type": "thermal_anomaly" | "power_anomaly" | "pressure_anomaly" | "attitude_anomaly" | "communication_anomaly" | "life_support_anomaly" | "none",
    "anomaly_description": "Clear description of what's wrong or 'none'",
    "severity": "critical" | "warning" | "nominal",
    "confidence_score": 0.0 to 1.0,
    "proposed_action": "Specific action to take or 'none'",
    "rationale": "Why you chose this action"
}}

Be thorough but accurate. False positives are better than false negatives in space operations."""


# ============================================================================
# Main Analyzer Node
# ============================================================================

def analyze(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Analyze telemetry data and detect anomalies.
    
    This node uses an LLM to analyze the telemetry data from the space station,
    detect any anomalies, and propose corrective actions.
    
    Features:
    - LLM caching for performance
    - Automatic fallback to rule-based analysis on LLM failure
    - Robust JSON parsing
    - Retry logic for network issues
    
    Args:
        state: Current agent state with telemetry data
        
    Returns:
        Updated state with analysis results
    """
    telemetry = state.get("telemetry", {})
    errors = list(state.get("errors", []))
    
    if not telemetry:
        error_msg = "No telemetry data available"
        errors.append(error_msg)
        logger.warning(error_msg)
        return {
            "anomaly": "No telemetry data available",
            "anomaly_type": "none",
            "proposed_action": None,
            "confidence_score": 0.0,
            "severity": "nominal",
            "rationale": "No data to analyze",
            "mission_phase": "analysis_complete",
            "analysis_method": "none",
            "last_updated": datetime.now().isoformat(),
            "errors": errors
        }
    
    # Try LLM analysis with retry logic
    llm = get_llm_client()
    
    if llm:
        try:
            from langchain_core.prompts import ChatPromptTemplate
            
            # Execute LLM call with retry
            def llm_call():
                prompt = ChatPromptTemplate.from_template(ANALYSIS_PROMPT)
                return llm.invoke(prompt.format(telemetry=json.dumps(telemetry, indent=2)))
            
            response = retry_with_backoff(llm_call, max_retries=3)
            
            # Parse JSON response
            result = extract_json_from_response(response.content)
            
            if result:
                logger.info(f"LLM Analysis: {result.get('anomaly_type', 'unknown')} - {result.get('severity', 'unknown')}")
                
                return {
                    "anomaly": result.get("anomaly_description", "none"),
                    "anomaly_type": result.get("anomaly_type", "none"),
                    "proposed_action": result.get("proposed_action", "none"),
                    "confidence_score": float(result.get("confidence_score", 0.5)),
                    "severity": result.get("severity", "nominal"),
                    "rationale": result.get("rationale", ""),
                    "anomaly_detected": result.get("anomaly_detected", False),
                    "mission_phase": "analysis_complete",
                    "analysis_method": "llm",
                    "last_updated": datetime.now().isoformat(),
                    "errors": errors
                }
            else:
                logger.warning("LLM returned invalid JSON, falling back to rule-based analysis")
                errors.append("LLM returned invalid JSON format")
                
        except Exception as e:
            logger.warning(f"LLM analysis failed: {e}, falling back to rule-based")
            errors.append(f"LLM error: {str(e)}")
    
    # Fallback: Rule-based analysis when LLM is unavailable or failed
    return rule_based_analysis(state, errors)


def rule_based_analysis(
    state: Dict[str, Any], 
    existing_errors: Optional[list] = None
) -> Dict[str, Any]:
    """
    Fallback rule-based analysis when LLM is unavailable.
    
    Applies expert rules for space station anomaly detection based on
    NASA/ESA operational thresholds.
    
    Args:
        state: Current agent state with telemetry data
        existing_errors: List of existing error messages
        
    Returns:
        Updated state with rule-based analysis results
    """
    telemetry = state.get("telemetry", {})
    errors = existing_errors or []
    
    # Critical thresholds (based on NASA/ESA standards)
    anomalies = []
    proposed_actions = []
    severity = "nominal"
    confidence = 1.0  # High confidence for rule-based
    
    # ========== Temperature Check ==========
    temp = telemetry.get("temp_c", 22)
    if temp > 35:
        anomalies.append(f"Critical thermal anomaly: {temp}°C")
        proposed_actions.append("Activate emergency cooling, notify crew")
        severity = "critical"
    elif temp > 28:
        anomalies.append(f"Elevated temperature: {temp}°C")
        proposed_actions.append("Adjust thermal control system")
        if severity != "critical":
            severity = "warning"
        confidence *= 0.8
    
    # ========== Power Check ==========
    power = telemetry.get("power_kw", 10)
    battery = telemetry.get("battery_charge_percent", 100)
    if power < 5 or battery < 30:
        anomalies.append(f"Power anomaly: {power}kW, battery {battery}%")
        proposed_actions.append("Activate power conservation mode, prepare for emergency")
        severity = "critical"
        confidence *= 0.9
    elif power < 8 or battery < 50:
        anomalies.append(f"Low power: {power}kW, battery {battery}%")
        proposed_actions.append("Reduce non-essential loads")
        if severity != "critical":
            severity = "warning"
        confidence *= 0.85
    
    # ========== Pressure Check ==========
    pressure = telemetry.get("pressure_kpa", 101)
    if pressure < 97:
        anomalies.append(f"Pressure leak detected: {pressure}kPa")
        proposed_actions.append("Initiate leak detection protocol, seal affected module")
        severity = "critical"
    elif pressure < 99:
        anomalies.append(f"Low pressure: {pressure}kPa")
        proposed_actions.append("Monitor for pressure decay")
        if severity != "critical":
            severity = "warning"
    
    # ========== Attitude Check ==========
    attitude = telemetry.get("attitude_error_deg", 0)
    if attitude > 5:
        anomalies.append(f"Attitude error: {attitude}°")
        proposed_actions.append("Activate reaction wheel correction")
        if attitude > 10:
            severity = "critical"
        elif severity != "critical":
            severity = "warning"
    elif attitude > 2:
        anomalies.append(f"Elevated attitude error: {attitude}°")
        proposed_actions.append("Monitor attitude control system")
        if severity != "critical":
            severity = "warning"
    
    # ========== Life Support Check ==========
    oxygen = telemetry.get("oxygen_percent", 100)
    co2 = telemetry.get("co2_level_mmhg", 0)
    
    if oxygen < 90:
        anomalies.append(f"Critical oxygen depletion: {oxygen}%")
        proposed_actions.append("Activate oxygen generation, prepare backup supply")
        severity = "critical"
    elif oxygen < 95:
        anomalies.append(f"Reduced oxygen: {oxygen}%")
        proposed_actions.append("Verify oxygen generation system")
        if severity != "critical":
            severity = "warning"
    
    if co2 > 6:
        anomalies.append(f"High CO2 levels: {co2}mmHg")
        proposed_actions.append("Activate CO2 scrubbers immediately")
        severity = "critical"
    elif co2 > 4:
        anomalies.append(f"Elevated CO2: {co2}mmHg")
        proposed_actions.append("Monitor CO2 levels, check scrubber status")
        if severity != "critical":
            severity = "warning"
    
    # ========== Communication Check ==========
    comm = telemetry.get("comm_status", "nominal")
    if comm != "nominal":
        anomalies.append(f"Communication issue: {comm}")
        proposed_actions.append("Switch to backup communication array")
        if severity != "critical":
            severity = "warning"
    
    # Determine result
    if anomalies:
        anomaly_desc = "; ".join(anomalies)
        action = "; ".join(proposed_actions)
    else:
        anomaly_desc = "none"
        action = "Continue nominal operations"
    
    logger.info(f"Rule-based analysis: {anomaly_desc} (severity: {severity}, confidence: {confidence:.2f})")
    
    return {
        "anomaly": anomaly_desc,
        "anomaly_type": _categorize_anomaly(anomaly_desc),
        "proposed_action": action,
        "confidence_score": confidence,
        "severity": severity,
        "rationale": "Rule-based analysis using NASA/ESA operational thresholds",
        "anomaly_detected": len(anomalies) > 0,
        "mission_phase": "analysis_complete",
        "analysis_method": "rule-based",
        "last_updated": datetime.now().isoformat(),
        "errors": errors
    }


def _categorize_anomaly(anomaly_desc: str) -> str:
    """
    Categorize an anomaly description into a known type.
    
    Args:
        anomaly_desc: Human-readable anomaly description
        
    Returns:
        Category string
    """
    desc_lower = anomaly_desc.lower()
    
    if "thermal" in desc_lower or "temperature" in desc_lower or "temp" in desc_lower:
        return "thermal_anomaly"
    elif "power" in desc_lower or "battery" in desc_lower:
        return "power_anomaly"
    elif "pressure" in desc_lower:
        return "pressure_anomaly"
    elif "attitude" in desc_lower:
        return "attitude_anomaly"
    elif "communication" in desc_lower or "comm" in desc_lower:
        return "communication_anomaly"
    elif "oxygen" in desc_lower or "co2" in desc_lower or "life support" in desc_lower:
        return "life_support_anomaly"
    else:
        return "none"

