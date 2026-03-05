from abc import ABC, abstractmethod

class AgentAdapter(ABC):
    @abstractmethod
    def __init__(self, api_key: str):
        pass

    @abstractmethod
    def create_session(self, prompt: str) -> str:
        """Create a new Devin session and return the session ID."""
        pass

    @abstractmethod
    def send_message(self, session_id: str, message: str):
        """Send a follow-up message to an existing session."""
        pass

    @abstractmethod
    def get_session_status(self, session_id: str) -> dict:
        """Get the current status of a session, including output if complete."""
        pass
