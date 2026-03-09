"""
AgentArmy OS v7.8 - Facial Login Service
=========================================
Facial authentication service with opt-in enrollment and login flows.

This module provides:
- User model with facial login flags
- Enrollment endpoint (opt-in + template storage)
- Login endpoint (comparison-based authentication)
- Revocation endpoint (data deletion)
- Governance enforcement

Governance: Login-only mode, opt-in required, human-controlled revocation.
"""

from typing import Dict, Optional, Any
from datetime import datetime
from pathlib import Path
import os
import json

# Try importing vision dependencies
try:
    import face_recognition
    FACE_REC_AVAILABLE = True
except ImportError:
    FACE_REC_AVAILABLE = False

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False


class UserModel:
    """
    User model with facial login support.
    
    Attributes:
        user_id: Unique user identifier
        segment: User segment (e.g., "beta", "production")
        facial_login_enabled: Whether facial login is enabled (default: False)
        facial_safety_override: Explicit consent flag (default: False)
        facial_template_path: Path to stored template embedding
        last_facial_auth_at: Timestamp of last successful auth
    """
    
    def __init__(
        self,
        user_id: str,
        segment: str = "beta",
        facial_login_enabled: bool = False,
        facial_safety_override: bool = False,
        facial_template_path: Optional[str] = None,
        last_facial_auth_at: Optional[datetime] = None,
        **kwargs
    ):
        self.user_id = user_id
        self.segment = segment
        self.facial_login_enabled = facial_login_enabled
        self.facial_safety_override = facial_safety_override
        self.facial_template_path = facial_template_path
        self.last_facial_auth_at = last_facial_auth_at
        self.extra_data = kwargs
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "user_id": self.user_id,
            "segment": self.segment,
            "facial_login_enabled": self.facial_login_enabled,
            "facial_safety_override": self.facial_safety_override,
            "facial_template_path": self.facial_template_path,
            "last_facial_auth_at": self.last_facial_auth_at.isoformat() if self.last_facial_auth_at else None,
            **self.extra_data
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserModel":
        """Create from dictionary."""
        last_auth = data.get("last_facial_auth_at")
        if last_auth and isinstance(last_auth, str):
            last_auth = datetime.fromisoformat(last_auth)
        
        return cls(
            user_id=data.get("user_id", ""),
            segment=data.get("segment", "beta"),
            facial_login_enabled=data.get("facial_login_enabled", False),
            facial_safety_override=data.get("facial_safety_override", False),
            facial_template_path=data.get("facial_template_path"),
            last_facial_auth_at=last_auth,
            **{k: v for k, v in data.items() if k not in [
                "user_id", "segment", "facial_login_enabled", 
                "facial_safety_override", "facial_template_path", 
                "last_facial_auth_at"
            ]}
        )


class FacialAuthService:
    """
    Facial authentication service with opt-in enrollment.
    
    Provides:
    - Enrollment with consent verification
    - Login with face comparison
    - Revocation with data deletion
    """
    
    def __init__(
        self,
        memory_dir: str = "memory",
        template_dir: str = "memory/templates",
        comparison_threshold: float = 0.6,
        consistency_threshold: float = 0.4
    ):
        self.memory_dir = Path(memory_dir)
        self.template_dir = Path(template_dir)
        self.comparison_threshold = comparison_threshold
        self.consistency_threshold = consistency_threshold
        
        # Create directories
        self.memory_dir.mkdir(exist_ok=True)
        self.template_dir.mkdir(exist_ok=True)
        
        # User storage (in-memory + file persistence)
        self.users: Dict[str, UserModel] = {}
        self._load_users()
    
    def _load_users(self) -> None:
        """Load users from file if exists."""
        users_file = self.memory_dir / "users.json"
        if users_file.exists():
            try:
                with open(users_file, 'r') as f:
                    data = json.load(f)
                    for user_id, user_data in data.items():
                        self.users[user_id] = UserModel.from_dict(user_data)
            except (json.JSONDecodeError, IOError):
                pass
    
    def _save_users(self) -> None:
        """Save users to file."""
        users_file = self.memory_dir / "users.json"
        try:
            with open(users_file, 'w') as f:
                json.dump(
                    {uid: u.to_dict() for uid, u in self.users.items()},
                    f,
                    indent=2
                )
        except IOError as e:
            print(f"Warning: Failed to save users: {e}")
    
    def get_user(self, user_id: str) -> Optional[UserModel]:
        """Get user by ID."""
        return self.users.get(user_id)
    
    def create_user(self, user_id: str, segment: str = "beta") -> UserModel:
        """Create a new user."""
        user = UserModel(user_id=user_id, segment=segment)
        self.users[user_id] = user
        self._save_users()
        return user
    
    def enroll(
        self,
        user_id: str,
        image_paths: list,
        safety_override: bool = False
    ) -> Dict[str, Any]:
        """
        Enroll user in facial login.
        
        Args:
            user_id: User identifier
            image_paths: List of paths to enrollment images
            safety_override: Explicit consent flag (required=True)
            
        Returns:
            Dict with enrollment status
        """
        if not safety_override:
            return {
                "status": "error",
                "error": "Explicit consent required",
                "code": "CONSENT_REQUIRED"
            }
        
        if not FACE_REC_AVAILABLE:
            return {
                "status": "error",
                "error": "face_recognition not available",
                "code": "DEPENDENCY_MISSING"
            }
        
        if not NUMPY_AVAILABLE:
            return {
                "status": "error",
                "error": "numpy not available",
                "code": "DEPENDENCY_MISSING"
            }
        
        # Get or create user
        user = self.users.get(user_id)
        if not user:
            user = self.create_user(user_id)
        
        # Process enrollment images
        templates = []
        for img_path in image_paths:
            if not os.path.exists(img_path):
                continue
            
            # Detect face
            detect_result = self._detect_face(img_path)
            if detect_result.get("count") != 1:
                return {
                    "status": "error",
                    "error": "Exactly one face required per image",
                    "code": "INVALID_IMAGE",
                    "details": detect_result
                }
            
            # Get encoding
            encoding = self._get_encoding(img_path)
            if encoding is not None:
                templates.append(encoding)
        
        if not templates:
            return {
                "status": "error",
                "error": "No valid face encodings found",
                "code": "NO_ENCODING"
            }
        
        # Check consistency if multiple images
        if len(templates) > 1:
            for i in range(1, len(templates)):
                dist = face_recognition.face_distance([templates[0]], templates[i])[0]
                if dist > self.consistency_threshold:
                    return {
                        "status": "error",
                        "error": "Images are inconsistent",
                        "code": "INCONSISTENT_IMAGES"
                    }
        
        # Save template
        template_path = self.template_dir / f"{user_id}_template.npy"
        np.save(template_path, templates[0])
        
        # Update user
        user.facial_safety_override = True
        user.facial_login_enabled = True
        user.facial_template_path = str(template_path)
        user.last_facial_auth_at = datetime.now()
        self._save_users()
        
        return {
            "status": "success",
            "message": "Enrolled successfully",
            "user_id": user_id
        }
    
    def login(self, user_id: str, image_path: str) -> Dict[str, Any]:
        """
        Authenticate user via facial comparison.
        
        Args:
            user_id: Claimed user identifier
            image_path: Path to login image
            
        Returns:
            Dict with authentication status
        """
        user = self.users.get(user_id)
        
        if not user:
            return {
                "status": "error",
                "error": "User not found",
                "code": "USER_NOT_FOUND"
            }
        
        if not user.facial_login_enabled or not user.facial_safety_override:
            return {
                "status": "error",
                "error": "Facial login not enabled or consented",
                "code": "NOT_ENABLED"
            }
        
        if not user.facial_template_path or not os.path.exists(user.facial_template_path):
            return {
                "status": "error",
                "error": "No template found",
                "code": "NO_TEMPLATE"
            }
        
        if not os.path.exists(image_path):
            return {
                "status": "error",
                "error": "Image not found",
                "code": "IMAGE_NOT_FOUND"
            }
        
        # Get current encoding
        current_enc = self._get_encoding(image_path)
        if current_enc is None:
            return {
                "status": "error",
                "error": "No face detected in image",
                "code": "NO_FACE"
            }
        
        # Load template and compare
        template = np.load(user.facial_template_path)
        distance = face_recognition.face_distance([template], current_enc)[0]
        
        if distance < self.comparison_threshold:
            # Success
            user.last_facial_auth_at = datetime.now()
            self._save_users()
            
            return {
                "status": "success",
                "message": "Authenticated",
                "user_id": user_id,
                "distance": float(distance)
            }
        else:
            return {
                "status": "error",
                "error": "Match failed",
                "code": "MATCH_FAILED",
                "distance": float(distance)
            }
    
    def revoke(self, user_id: str) -> Dict[str, Any]:
        """
        Revoke facial login and delete template.
        
        Args:
            user_id: User identifier
            
        Returns:
            Dict with revocation status
        """
        user = self.users.get(user_id)
        
        if not user:
            return {
                "status": "error",
                "error": "User not found",
                "code": "USER_NOT_FOUND"
            }
        
        # Delete template file
        if user.facial_template_path and os.path.exists(user.facial_template_path):
            try:
                os.remove(user.facial_template_path)
            except OSError:
                pass
        
        # Update user flags
        user.facial_login_enabled = False
        user.facial_safety_override = False
        user.facial_template_path = None
        user.last_facial_auth_at = None
        self._save_users()
        
        return {
            "status": "success",
            "message": "Facial data revoked",
            "user_id": user_id
        }
    
    def _detect_face(self, image_path: str) -> Dict[str, Any]:
        """Detect faces in image (stub - uses VisionWorker if available)."""
        # Try to use VisionWorker if available
        try:
            from core.workers.vision_worker import VisionWorker
            vw = VisionWorker()
            return vw.execute_face_detect({"image_path": image_path})
        except Exception:
            pass
        
        # Fallback: basic detection
        if not FACE_REC_AVAILABLE:
            return {"count": 0, "error": "face_recognition not available"}
        
        img = face_recognition.load_image_file(image_path)
        locations = face_recognition.face_locations(img)
        return {"count": len(locations)}
    
    def _get_encoding(self, image_path: str):
        """Get face encoding from image."""
        if not FACE_REC_AVAILABLE:
            return None
        
        try:
            img = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(img)
            return encodings[0] if encodings else None
        except Exception:
            return None


# Global service instance
_facial_auth_service: Optional[FacialAuthService] = None


def get_facial_auth_service() -> FacialAuthService:
    """Get or create global FacialAuthService instance."""
    global _facial_auth_service
    if _facial_auth_service is None:
        _facial_auth_service = FacialAuthService()
    return _facial_auth_service


__all__ = [
    "UserModel",
    "FacialAuthService",
    "get_facial_auth_service"
]
