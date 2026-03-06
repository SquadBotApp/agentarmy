"""
Telemetry Analyzer Node
Uses LLM to analyze telemetry data, detect anomalies, and propose actions.
Supports multiple LLM providers: Google AI (Gemini), OpenRouter, Groq, xAI, OpenAI, Anthropic.
"""

import json
import os
from typing import Dict, Any
from datetime import datetime


def get_llm_client():
    """
    Get the configured LLM client based on available API keys.
    
    Supported providers (in priority order):
    1. Google AI Studio (Gemini) - No rate limits, free tier
    2. OpenRouter - Access to 50+ models (DeepSeek, Qwen, Kimi, etc.)
    3. Groq - Lightning-fast inference for Llama, Mistral, DeepSeek
    4. xAI Grok - Fast reasoning model
    5. OpenAI GPT-4o - Top-tier models
    6. Anthropic Claude - Best for complex reasoning
    """
    # 1. Try Google AI Studio (Gemini) - Recommended for free tier
    if os.getenv("GOOGLE_API_KEY"):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                temperature=0,
                google_api_key=os.getenv("GOOGLE_API_KEY")
            )
        except ImportError:
            pass
    
    # 2. Try OpenRouter - Access to 50+ models
    if os.getenv("OPENROUTER_API_KEY"):
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model="openrouter/ai/qwen/qwen2.5-72b-instruct",
                temperature=0,
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url="https://openrouter.ai/v1"
            )
        except ImportError:
            pass
    
    # 3. Try Groq - Lightning-fast inference
    if os.getenv("GROQ_API_KEY"):
        try:
            from langchain_groq import ChatGroq
            model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
            return ChatGroq(model=model, temperature=0, groq_api_key=os.getenv("GROQ_API_KEY"))
        except ImportError:
            pass
    
    # 4. Try xAI Grok
    if os.getenv("GROK_API_KEY"):
        try:
            from langchain_xai import ChatXAI
            return ChatXAI(model="grok-beta", temperature=0, xai_api_key=os.getenv("GROK_API_KEY"))
        except ImportError:
            pass
    
    # 5. Try OpenAI
    if os.getenv("OPENAI_API_KEY"):
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(model="gpt-4o", temperature=0, api_key=os.getenv("OPENAI_API_KEY"))
        except ImportError:
            pass
    
    # 6. Try Anthropic
    if os.getenv("ANTHROPIC_API_KEY"):
        try:
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(model="claude-sonnet-4-20250514", temperature=0, anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"))
        except ImportError:
            pass
    
    # Fallback to rule-based analysis
    return None


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


def analyze(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node: Analyze telemetry data and detect anomalies.
    
    This node uses an LLM to analyze the telemetry data from the space station,
    detect any anomalies, and propose corrective actions.
    
    Args:
        state: Current agent state with telemetry data
        
    Returns:
        Updated state with analysis results
    """
    telemetry = state.get("telemetry", {})
    
    if not telemetry:
        return {
            "anomaly": "No telemetry data available",
            "proposed_action": None,
            "confidence_score": 0.0,
            "mission_phase": "analysis_complete",
            "errors": state.get("errors", []) + ["No telemetry data to analyze"]
        }
    
    # Try to use LLM for analysis
    llm = get_llm_client()
    
    if llm:
        try:
            from langchain_core.prompts import ChatPromptTemplate
            
            prompt = ChatPromptTemplate.from_template(ANALYSIS_PROMPT)
            response = llm.invoke(prompt.format(telemetry=json.dumps(telemetry, indent=2)))
            
            # Parse JSON response
            result = json.loads(response.content)
            
            print(f"Analysis complete: {result.get('anomaly_type', 'unknown')} - {result.get('severity', 'unknown')}")
            
            return {
                "anomaly": result.get("anomaly_description", "none"),
                "anomaly_type": result.get("anomaly_type", "none"),
                "proposed_action": result.get("proposed_action", "none"),
                "confidence_score": result.get("confidence_score", 0.5),
                "severity": result.get("severity", "nominal"),
                "rationale": result.get("rationale", ""),
                "mission_phase": "analysis_complete",
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"LLM analysis failed: {e}")
            # Fall through to rule-based analysis
    
    # Fallback: Rule-based analysis when LLM is unavailable
    return rule_based_analysis(state)


def rule_based_analysis(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback rule-based analysis when LLM is unavailable.
    
    Applies expert rules for space station anomaly detection.
    """
    telemetry = state.get("telemetry", {})
    errors = []
    
    # Critical thresholds (based on NASA/ESA standards)
    anomalies = []
    proposed_actions = []
    severity = "nominal"
    confidence = 1.0  # High confidence for rule-based
    
    # Temperature check
    temp = telemetry.get("temp_c", 22)
    if temp > 35:
        anomalies.append(f"Critical thermal anomaly: {temp}C")
        proposed_actions.append("Activate emergency cooling, notify crew")
        severity = "critical"
    elif temp > 28:
        anomalies.append(f"Elevated temperature: {temp}C")
        proposed_actions.append("Adjust thermal control system")
        severity = "warning" if severity != "critical" else "critical"
        confidence *= 0.8
    
    # Power check
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
        severity = "warning" if severity != "critical" else "critical"
        confidence *= 0.85
    
    # Pressure check
    pressure = telemetry.get("pressure_kpa", 101)
    if pressure < 97:
        anomalies.append(f"Pressure leak detected: {pressure}kPa")
        proposed_actions.append("Initiate leak detection protocol, seal affected module")
        severity = "critical"
    elif pressure < 99:
        anomalies.append(f"Low pressure: {pressure}kPa")
        proposed_actions.append("Monitor for pressure decay")
        severity = "warning" if severity != "critical" else "critical"
    
    # Attitude check
    attitude = telemetry.get("attitude_error_deg", 0)
    if attitude > 5:
        anomalies.append(f"Attitude error: {attitude} deg")
        proposed_actions.append("Activate reaction wheel correction")
        severity = "critical" if attitude > 10 else ("warning" if severity != "critical" else "critical")
    elif attitude > 2:
        anomalies.append(f"Elevated attitude error: {attitude} deg")
        proposed_actions.append("Monitor attitude control system")
        severity = "warning" if severity != "critical" else "critical"
    
    # Life support check
    oxygen = telemetry.get("oxygen_percent", 100)
    co2 = telemetry.get("co2_level_mmhg", 0)
    if oxygen < 90:
        anomalies.append(f"Low oxygen: {oxygen}%")
        proposed_actions.append("Activate oxygen generation, prepare backup supply")
        severity = "critical"
    elif oxygen < 95:
        anomalies.append(f"Reduced oxygen: {oxygen}%")
        proposed_actions.append("Verify oxygen generation system")
        severity = "warning" if severity != "critical" else "critical"
    
    if co2 > 6:
        anomalies.append(f"High CO2: {co2}mmHg")
        proposed_actions.append("Activate CO2 scrubbers")
        severity = "critical"
    elif co2 > 4:
        anomalies.append(f"Elevated CO2: {co2}mmHg")
        proposed_actions.append("Monitor CO2 levels")
        severity = "warning" if severity != "critical" else "critical"
    
    # Communication check
    comm = telemetry.get("comm_status", "nominal")
    if comm != "nominal":
        anomalies.append(f"Communication issue: {comm}")
        proposed_actions.append("Switch to backup communication array")
        severity = "warning" if severity != "critical" else "critical"
    
    # Determine result
    if anomalies:
        anomaly_desc = "; ".join(anomalies)
        action = "; ".join(proposed_actions)
    else:
        anomaly_desc = "none"
        action = "Continue nominal operations"
    
    print(f"Rule-based analysis: {anomaly_desc} (severity: {severity})")
    
    return {
        "anomaly": anomaly_desc,
        "proposed_action": action,
        "confidence_score": confidence,
        "severity": severity,
        "rationale": "Rule-based analysis using NASA/ESA thresholds",
        "mission_phase": "analysis_complete",
        "last_updated": datetime.now().isoformat(),
        "errors": errors
    }
