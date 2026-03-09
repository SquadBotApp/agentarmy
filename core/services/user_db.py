"""
AgentArmy OS - User Database & Authentication Service
=================================================
Local user database with password, MFA, and facial login support.

Features:
- Password-based authentication
- MFA (email code)
- Facial login (opt-in)
- User session management
- Audit logging
"""

import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, List
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class UserDatabase:
    """
    Local user database with secure password storage.
    """
    
    def __init__(self, db_path: str = "memory/users.json"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.users: Dict[str, Dict] = {}
        self.sessions: Dict[str, Dict] = {}  # session_token -> user data
        self._load()
    
    def _load(self) -> None:
        """Load users from file."""
        if self.db_path.exists():
            try:
                with open(self.db_path, 'r') as f:
                    data = json.load(f)
                    self.users = data.get('users', {})
            except (json.JSONDecodeError, IOError):
                self.users = {}
    
    def _save(self) -> None:
        """Save users to file."""
        try:
            with open(self.db_path, 'w') as f:
                json.dump({'users': self.users}, f, indent=2, default=str)
        except IOError as e:
            logger.error(f"Failed to save users: {e}")
    
    def create_user(
        self,
        username: str,
        email: str,
        password: str,
        segment: str = "beta"
    ) -> Dict[str, Any]:
        """Create a new user."""
        if username in self.users:
            return {"status": "error", "error": "Username already exists"}
        
        # Hash password
        password_hash = self._hash_password(password)
        
        user = {
            "user_id": username,
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "segment": segment,
            "tier": "owner" if not self.users else "standard",
            "created_at": datetime.now().isoformat(),
            "last_login_at": None,
            # Security flags
            "mfa_enabled": False,
            "mfa_secret": None,
            "facial_login_enabled": False,
            "facial_safety_override": False,
            "facial_template_path": None,
            "last_facial_auth_at": None,
            # API keys
            "api_keys": []
        }
        
        self.users[username] = user
        self._save()
        
        return {"status": "success", "user_id": username}
    
    def _hash_password(self, password: str, salt: str = "") -> str:
        """Hash password with salt."""
        if not salt:
            salt = secrets.token_hex(16)
        hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return f"{salt}${hash_obj.hex()}"
    
    def verify_password(self, username: str, password: str) -> bool:
        """Verify password for user."""
        user = self.users.get(username)
        if not user:
            return False
        
        stored_hash = user.get("password_hash", "")
        if "$" not in stored_hash:
            return False
        
        salt = stored_hash.split("$")[0]
        return self._hash_password(password, salt) == stored_hash
    
    def authenticate(self, username: str, password: str) -> Optional[Dict]:
        """Authenticate user and create session."""
        if not self.verify_password(username, password):
            return None
        
        user = self.users[username]
        
        # Update last login
        user["last_login_at"] = datetime.now().isoformat()
        self._save()
        
        # Create session
        session_token = secrets.token_urlsafe(32)
        self.sessions[session_token] = {
            "user_id": username,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        return {
            "session_token": session_token,
            "user_id": username,
            "tier": user.get("tier", "standard")
        }
    
    def verify_session(self, session_token: str) -> Optional[str]:
        """Verify session and return user_id."""
        session = self.sessions.get(session_token)
        if not session:
            return None
        
        # Check expiration
        expires_at = datetime.fromisoformat(session["expires_at"])
        if datetime.now() > expires_at:
            del self.sessions[session_token]
            return None
        
        return session["user_id"]
    
    def logout(self, session_token: str) -> bool:
        """Logout user by removing session."""
        if session_token in self.sessions:
            del self.sessions[session_token]
            return True
        return False
    
    def get_user(self, username: str) -> Optional[Dict]:
        """Get user by username."""
        return self.users.get(username)
    
    def update_user(self, username: str, updates: Dict) -> bool:
        """Update user fields."""
        if username not in self.users:
            return False
        self.users[username].update(updates)
        self._save()
        return True
    
    def change_password(self, username: str, old_password: str, new_password: str) -> Dict:
        """Change user password."""
        if not self.verify_password(username, old_password):
            return {"status": "error", "error": "Invalid old password"}
        
        new_hash = self._hash_password(new_password)
        self.users[username]["password_hash"] = new_hash
        self._save()
        
        return {"status": "success", "message": "Password changed"}
    
    def enable_mfa(self, username: str) -> Dict:
        """Enable MFA for user."""
        import pyotp
        secret = pyotp.random_base32()
        
        self.users[username]["mfa_enabled"] = True
        self.users[username]["mfa_secret"] = secret
        self._save()
        
        # Generate QR code URL
        totp = pyotp.TOTP(secret)
        provisioning_url = totp.provisioning_uri(
            username,
            issuer_name="AgentArmy OS"
        )
        
        return {
            "status": "success",
            "secret": secret,
            "provisioning_url": provisioning_url
        }
    
    def verify_mfa(self, username: str, code: str) -> bool:
        """Verify MFA code."""
        import pyotp
        user = self.users.get(username)
        if not user or not user.get("mfa_enabled"):
            return False
        
        secret = user.get("mfa_secret")
        if not secret:
            return False
        
        totp = pyotp.TOTP(secret)
        return totp.verify(code)
    
    def disable_mfa(self, username: str, password: str) -> Dict:
        """Disable MFA for user."""
        if not self.verify_password(username, password):
            return {"status": "error", "error": "Invalid password"}
        
        self.users[username]["mfa_enabled"] = False
        self.users[username]["mfa_secret"] = None
        self._save()
        
        return {"status": "success", "message": "MFA disabled"}
    
    def list_users(self) -> List[str]:
        """List all usernames."""
        return list(self.users.keys())
    
    def delete_user(self, username: str) -> Dict:
        """Delete a user."""
        if username not in self.users:
            return {"status": "error", "error": "User not found"}
        
        del self.users[username]
        self._save()
        
        return {"status": "success", "message": f"User {username} deleted"}


# Global instance
_user_db: Optional[UserDatabase] = None


def get_user_db() -> UserDatabase:
    """Get or create global user database."""
    global _user_db
    if _user_db is None:
        _user_db = UserDatabase()
    return _user_db


__all__ = ["UserDatabase", "get_user_db"]
