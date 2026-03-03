"""
Security Enhancements for AgentArmyOS
- Provides encryption utilities and network isolation toggles for internal cloud/offline mode.
"""
import os
from cryptography.fernet import Fernet

class SecurityManager:
    def __init__(self, key_path="./.internal_cloud_key"):
        self.key_path = key_path
        self.key = self._load_or_create_key()
        self.cipher = Fernet(self.key)

    def _load_or_create_key(self):
        if os.path.exists(self.key_path):
            with open(self.key_path, "rb") as f:
                return f.read()
        key = Fernet.generate_key()
        with open(self.key_path, "wb") as f:
            f.write(key)
        return key

    def encrypt(self, data: bytes) -> bytes:
        return self.cipher.encrypt(data)

    def decrypt(self, token: bytes) -> bytes:
        return self.cipher.decrypt(token)

    def enable_network_isolation(self):
        # Example: block all outbound traffic except localhost (stub)
        os.system("netsh advfirewall firewall add rule name='AgentArmyBlockOutbound' dir=out action=block remoteip=any")
        return {"status": "network_isolation_enabled"}

    def disable_network_isolation(self):
        os.system("netsh advfirewall firewall delete rule name='AgentArmyBlockOutbound'")
        return {"status": "network_isolation_disabled"}
