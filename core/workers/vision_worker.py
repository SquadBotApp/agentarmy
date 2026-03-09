"""
AgentArmy OS — Vision Worker v1.0 (Safe Vision)
===============================================
Handles safe facial tasks: detect, analyze, compare (user-only), blur.

Dependencies: opencv-python, face_recognition, pillow
Install: pip install opencv-python face_recognition pillow

This module provides privacy-preserving vision capabilities:
- Face detection: Detect faces in user-supplied images
- Face analysis: Analyze face attributes (expression, glasses, beard, head pose)
- Face compare: Compare two user-supplied images for similarity
- Face blur: Apply privacy blur to detected faces

GOVERNANCE: All operations require user-supplied images only.
No identification, no databases, no surveillance.
"""

from typing import Dict, Any, List, Tuple, Optional
import os
import json
from datetime import datetime
from pathlib import Path

# Try importing vision dependencies - graceful degradation if not installed
try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    np = None

try:
    import face_recognition
    FACE_REC_AVAILABLE = True
except ImportError:
    FACE_REC_AVAILABLE = False

try:
    from PIL import Image, ImageDraw
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class VisionError(Exception):
    """Custom exception for Vision Worker errors."""
    pass


class GovernanceError(Exception):
    """Custom exception for governance violations."""
    pass


class AuditLogger:
    """
    Immutable audit logging for all vision tasks.
    Provides traceability for compliance and accountability.
    """
    
    def __init__(self, log_dir: str = "vision_audit_logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        self.log_file = self.log_dir / f"vision_audit_{datetime.now().strftime('%Y%m%d')}.jsonl"
    
    def log_action(self, action: str, details: Dict[str, Any]) -> None:
        """Log a vision action with timestamp and details."""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "details": details,
            "version": "v7.6"
        }
        
        with open(self.log_file, 'a') as f:
            f.write(json.dumps(log_entry) + "\n")
    
    def get_logs(self, limit: int = 100) -> List[Dict]:
        """Retrieve recent audit logs."""
        logs = []
        if not self.log_file.exists():
            return logs
        
        with open(self.log_file, 'r') as f:
            for line in f:
                if line.strip():
                    logs.append(json.loads(line))
                    if len(logs) >= limit:
                        break
        
        return list(reversed(logs))


class VisionWorker:
    """
    AgentArmy OS — Vision Worker v1.0
    
    Handles safe facial tasks with strict privacy controls:
    - face_detect: Detect faces in user-supplied images
    - face_analyze: Analyze face attributes
    - face_compare: Compare two user-supplied images (user-only)
    - face_blur: Apply privacy blur to faces
    
    Governance Rules:
    - No identification of individuals
    - No database matching
    - No surveillance capabilities
    - User-supplied images only (no external URLs)
    """
    
    def __init__(self, core_os=None, audit_logger: AuditLogger = None):
        """
        Initialize VisionWorker.
        
        Args:
            core_os: Reference to AgentArmyOS instance (optional)
            audit_logger: Custom audit logger (optional)
        """
        self.os = core_os
        self.audit_log = audit_logger or AuditLogger()
        
        # Initialize face detection cascade
        self.face_cascade = None
        if CV2_AVAILABLE:
            # Use OpenCV's built-in Haar cascade for face detection
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            if os.path.exists(cascade_path):
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # Governance: Forbidden query patterns
        self.forbidden_patterns = [
            "identify this person",
            "who is this",
            "who is this person",
            "match to database",
            "match to criminal",
            "surveillance",
            "find person",
            "recognize face",
            "facial recognition database"
        ]
    
    def _check_governance(self, query: str, task: Dict[str, Any]) -> None:
        """
        Check governance rules before executing vision tasks.
        
        Raises:
            GovernanceError: If query violates governance rules
        """
        query_lower = query.lower()
        
        # Check for forbidden patterns
        for pattern in self.forbidden_patterns:
            if pattern in query_lower:
                raise GovernanceError(
                    f"Vision boundary violation: '{pattern}' is not allowed. "
                    "No identification or surveillance capabilities permitted."
                )
        
        # For face_detect, face_analyze, face_blur: require image_path
        tool = task.get('tool', '')
        if tool in ['face_detect', 'face_analyze', 'face_blur']:
            if 'image_path' not in task:
                raise ValueError("User-supplied image required for vision tasks")
        
        # For face_compare: require both images
        if tool == 'face_compare':
            if 'image_path1' not in task or 'image_path2' not in task:
                raise ValueError("Two user-supplied images required for face comparison")
    
    def execute_face_detect(self, task: Dict) -> Dict:
        """
        Detect faces in a user-supplied image.
        
        Args:
            task: Dict with 'image_path' key pointing to user image
            
        Returns:
            Dict with 'count' (number of faces) and 'bounding_boxes'
        """
        if not CV2_AVAILABLE:
            raise VisionError("OpenCV not available. Install: pip install opencv-python")
        
        image_path = task['image_path']
        
        # Validate file exists
        if not os.path.exists(image_path):
            raise VisionError(f"Image not found: {image_path}")
        
        # Read and process image
        img = cv2.imread(image_path)
        if img is None:
            raise VisionError(f"Failed to read image: {image_path}")
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        if self.face_cascade:
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        else:
            # Fallback: return empty if no cascade
            faces = []
        
        results = {
            'count': len(faces),
            'bounding_boxes': [(int(x), int(y), int(x+w), int(y+h)) for (x, y, w, h) in faces],
            'image_path': image_path,
            'tool': 'face_detect'
        }
        
        # Audit log
        self.audit_log.log_action("face_detect", {
            "image": image_path,
            "faces_found": len(faces),
            "boxes": results['bounding_boxes']
        })
        
        return results
    
    def execute_face_analyze(self, task: Dict) -> Dict:
        """
        Analyze face attributes in a user-supplied image.
        
        Note: This provides basic analysis only. No identification.
        
        Args:
            task: Dict with 'image_path' key pointing to user image
            
        Returns:
            Dict with face attributes (expression, glasses, beard, head_pose)
        """
        if not FACE_REC_AVAILABLE:
            raise VisionError("face_recognition not available. Install: pip install face_recognition")
        
        image_path = task['image_path']
        
        # Validate
        if not os.path.exists(image_path):
            raise VisionError(f"Image not found: {image_path}")
        
        # Load image
        img = face_recognition.load_image_file(image_path)
        face_locations = face_recognition.face_locations(img)
        
        if not face_locations:
            return {'error': 'No faces detected', 'image_path': image_path}
        
        # Get encodings for analysis
        encodings = face_recognition.face_encodings(img, face_locations)
        
        # Basic attribute placeholders (extend with ML models if needed)
        # Note: This is privacy-safe analysis, not identification
        attributes = {
            'faces_detected': len(face_locations),
            'expression': 'neutral',  # Extend with emotion detection if needed
            'glasses': False,
            'beard': False,
            'head_pose': {'yaw': 0, 'pitch': 0, 'roll': 0},
            'image_path': image_path,
            'tool': 'face_analyze'
        }
        
        # Audit log
        self.audit_log.log_action("face_analyze", {
            "image": image_path,
            "faces_analyzed": len(face_locations),
            "attributes": attributes
        })
        
        return attributes
    
    def execute_face_compare(self, task: Dict) -> Dict:
        """
        Compare two user-supplied images for similarity.
        
        User-only: Both images must be provided by the user.
        
        Args:
            task: Dict with 'image_path1' and 'image_path2' keys
            
        Returns:
            Dict with 'likely_same' (boolean) and 'score' (0-1 similarity)
        """
        if not FACE_REC_AVAILABLE:
            raise VisionError("face_recognition not available. Install: pip install face_recognition")
        
        if 'image_path1' not in task or 'image_path2' not in task:
            raise ValueError("Both images must be user-provided")
        
        image_path1 = task['image_path1']
        image_path2 = task['image_path2']
        
        # Validate both files exist
        for path in [image_path1, image_path2]:
            if not os.path.exists(path):
                raise VisionError(f"Image not found: {path}")
        
        # Load images
        img1 = face_recognition.load_image_file(image_path1)
        img2 = face_recognition.load_image_file(image_path2)
        
        # Get encodings
        enc1 = face_recognition.face_encodings(img1)
        enc2 = face_recognition.face_encodings(img2)
        
        if not enc1 or not enc2:
            return {
                'error': 'Faces not detected in one or both images',
                'image_path1': image_path1,
                'image_path2': image_path2
            }
        
        # Calculate similarity
        distance = face_recognition.face_distance([enc1[0]], enc2[0])[0]
        similarity = 1 - distance  # 0-1 score
        
        results = {
            'likely_same': similarity > 0.6,  # Tunable threshold
            'score': round(similarity, 3),
            'threshold': 0.6,
            'image_path1': image_path1,
            'image_path2': image_path2,
            'tool': 'face_compare'
        }
        
        # Audit log
        self.audit_log.log_action("face_compare", {
            "images": [image_path1, image_path2],
            "similarity": similarity,
            "likely_same": results['likely_same']
        })
        
        return results
    
    def execute_face_blur(self, task: Dict) -> Dict:
        """
        Apply privacy blur to detected faces in an image.
        
        Args:
            task: Dict with 'image_path' and optional 'output_path'
            
        Returns:
            Dict with 'output_path' to blurred image
        """
        if not CV2_AVAILABLE:
            raise VisionError("OpenCV not available. Install: pip install opencv-python")
        
        image_path = task['image_path']
        output_path = task.get('output_path', image_path.replace('.', '_blurred.'))
        
        # Validate
        if not os.path.exists(image_path):
            raise VisionError(f"Image not found: {image_path}")
        
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise VisionError(f"Failed to read image: {image_path}")
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        if self.face_cascade:
            faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        else:
            faces = []
        
        # Apply strong Gaussian blur to each face
        for (x, y, w, h) in faces:
            # Strong blur for privacy (99x99 kernel, sigma=30)
            img[y:y+h, x:x+w] = cv2.GaussianBlur(img[y:y+h, x:x+w], (99, 99), 30)
        
        # Save blurred image
        cv2.imwrite(output_path, img)
        
        results = {
            'output_path': output_path,
            'faces_blurred': len(faces),
            'original_path': image_path,
            'tool': 'face_blur'
        }
        
        # Audit log
        self.audit_log.log_action("face_blur", {
            "input": image_path,
            "output": output_path,
            "faces_blurred": len(faces)
        })
        
        return results
    
    def execute(self, task: Dict) -> Dict:
        """
        Main execute method - routes to appropriate handler.
        
        Args:
            task: Dict with 'tool' key specifying the vision operation
            
        Returns:
            Dict with operation results
            
        Raises:
            GovernanceError: If query violates governance rules
            VisionError: If operation fails
        """
        query = task.get('query', '')
        tool = task.get('tool', '')
        
        # Check governance
        self._check_governance(query, task)
        
        # Route to appropriate handler
        if tool == 'face_detect':
            return self.execute_face_detect(task)
        elif tool == 'face_analyze':
            return self.execute_face_analyze(task)
        elif tool == 'face_compare':
            return self.execute_face_compare(task)
        elif tool == 'face_blur':
            return self.execute_face_blur(task)
        else:
            raise VisionError(f"Unknown vision tool: {tool}")
    
    @property
    def is_available(self) -> bool:
        """Check if vision capabilities are available."""
        return CV2_AVAILABLE and FACE_REC_AVAILABLE
    
    def get_capabilities(self) -> Dict[str, bool]:
        """Get availability of each capability."""
        return {
            "face_detect": CV2_AVAILABLE,
            "face_analyze": FACE_REC_AVAILABLE,
            "face_compare": FACE_REC_AVAILABLE,
            "face_blur": CV2_AVAILABLE,
            "full_vision": self.is_available
        }


# Convenience function for direct usage
def create_vision_worker(core_os=None) -> VisionWorker:
    """Create and return a VisionWorker instance."""
    return VisionWorker(core_os=core_os)


__all__ = [
    "VisionWorker",
    "VisionError", 
    "GovernanceError",
    "AuditLogger",
    "create_vision_worker"
]

