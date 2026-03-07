import requests
from .agent_adapter import AgentAdapter  # Adjust this import if your AgentAdapter is elsewhere

class DevinAIAgentAdapter(AgentAdapter):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.devin.ai/v3/organizations"

    def create_session(self, prompt: str) -> str:
        response = requests.post(
            f"{self.base_url}/sessions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={"prompt": prompt}
        )
        response.raise_for_status()
        session_data = response.json()
        return session_data["session_id"]

    def send_message(self, session_id: str, message: str):
        response = requests.post(
            f"{self.base_url}/sessions/{session_id}/messages",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={"message": message}
        )
        response.raise_for_status()

    def get_session_status(self, session_id: str) -> dict:
        response = requests.get(
            f"{self.base_url}/sessions/{session_id}",
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        response.raise_for_status()
        return response.json()
