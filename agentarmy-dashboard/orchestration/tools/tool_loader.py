"""
Tool registry and loader for CrewAI agents
Provides tools for research, coding, synthesis, etc.
"""

from crewai_tools import SerperDevTool, ScrapeWebsiteTool, FileReadTool, FileWriteTool
from typing import List, Optional

def get_tools(tool_names: Optional[List[str]] = None) -> List:
    """
    Load and return tools for agents
    
    Args:
        tool_names: List of tool names to load (e.g., ["research", "code"])
                   If None, returns all available tools
    
    Returns:
        List of tool instances
    """
    
    all_tools = {}
    
    # Research tools
    try:
        all_tools["research"] = SerperDevTool()
    except Exception as e:
        print(f"[Tools] SerperDev unavailable: {e}")
    
    try:
        all_tools["web_scrape"] = ScrapeWebsiteTool()
    except Exception as e:
        print(f"[Tools] Web scraper unavailable: {e}")
    
    # File tools
    try:
        all_tools["read_file"] = FileReadTool()
        all_tools["write_file"] = FileWriteTool()
    except Exception as e:
        print(f"[Tools] File tools unavailable: {e}")
    
    # If none specified, return all available
    if tool_names is None:
        return list(all_tools.values())
    
    # Otherwise, return requested tools that exist
    loaded = []
    for name in tool_names:
        if name in all_tools:
            loaded.append(all_tools[name])
        else:
            print(f"[Tools] Tool '{name}' not found")
    
    return loaded

# Tool categories for easy selection
TOOL_CATEGORIES = {
    "research": ["research", "web_scrape"],
    "file_ops": ["read_file", "write_file"],
    "all": ["research", "web_scrape", "read_file", "write_file"],
    "none": [],
}

def get_tools_by_category(category: str) -> List:
    """Get tools by category"""
    tool_names = TOOL_CATEGORIES.get(category, [])
    return get_tools(tool_names)
