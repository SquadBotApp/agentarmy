"""
Apipheny API Integration Provider
This provider allows AgentArmy to interact with Google Sheets and other APIs via Apipheny.
"""

import os
import aiohttp
from typing import Dict, Any

APIPHENY_API_KEY = os.getenv("APIPHENY_API_KEY")
APIPHENY_BASE_URL = "https://api.apipheny.io/v1"

async def apipheny_request(endpoint: str, method: str = "GET", params: Dict[str, Any] = None, data: Dict[str, Any] = None) -> Any:
    headers = {
        "Authorization": f"Bearer {APIPHENY_API_KEY}",
        "Content-Type": "application/json"
    }
    url = f"{APIPHENY_BASE_URL}/{endpoint}"
    async with aiohttp.ClientSession() as session:
        if method.upper() == "GET":
            async with session.get(url, headers=headers, params=params) as resp:
                return await resp.json()
        elif method.upper() == "POST":
            async with session.post(url, headers=headers, json=data) as resp:
                return await resp.json()
        else:
            raise ValueError("Unsupported HTTP method for Apipheny integration.")

# Example usage:
# result = await apipheny_request("sheets", method="GET", params={"spreadsheetId": "..."})
