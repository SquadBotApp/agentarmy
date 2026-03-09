"""
AGENTARMY OS v7.6 - Safe Vision Demo
====================================
Demonstrates safe vision capabilities with governance enforcement.

This demo shows:
1. Face detection in user-supplied images
2. Face analysis (attributes)
3. Face comparison (user-provided images only)
4. Face blur (privacy protection)

Governance: All operations require user-supplied images.
No identification, no surveillance, no database matching.

Usage:
    python examples/vision_demo.py

Requirements:
    pip install opencv-python face_recognition pillow
"""

import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from core.workers.vision_worker import VisionWorker, GovernanceError, AuditLogger


def print_result(operation: str, result: dict):
    """Pretty print operation results."""
    print(f"\n{'='*50}")
    print(f"OPERATION: {operation}")
    print('='*50)
    for key, value in result.items():
        print(f"  {key}: {value}")
    print()


def demo_face_detect(vision_worker: VisionWorker, image_path: str):
    """Demo: Face detection"""
    print("\n[1] FACE DETECTION DEMO")
    print("-" * 40)
    
    task = {
        'tool': 'face_detect',
        'image_path': image_path,
        'query': 'detect faces in this image'
    }
    
    try:
        result = vision_worker.execute_face_detect(task)
        print_result("Face Detection", result)
    except Exception as e:
        print(f"ERROR: {e}")


def demo_face_analyze(vision_worker: VisionWorker, image_path: str):
    """Demo: Face analysis"""
    print("\n[2] FACE ANALYSIS DEMO")
    print("-" * 40)
    
    task = {
        'tool': 'face_analyze',
        'image_path': image_path,
        'query': 'analyze face attributes'
    }
    
    try:
        result = vision_worker.execute_face_analyze(task)
        print_result("Face Analysis", result)
    except Exception as e:
        print(f"ERROR: {e}")


def demo_face_compare(vision_worker: VisionWorker, image1: str, image2: str):
    """Demo: Face comparison (two user images)"""
    print("\n[3] FACE COMPARISON DEMO")
    print("-" * 40)
    print("Comparing two user-provided images...")
    
    task = {
        'tool': 'face_compare',
        'image_path1': image1,
        'image_path2': image2,
        'query': 'compare these two faces'
    }
    
    try:
        result = vision_worker.execute_face_compare(task)
        print_result("Face Comparison", result)
    except Exception as e:
        print(f"ERROR: {e}")


def demo_face_blur(vision_worker: VisionWorker, image_path: str):
    """Demo: Face blur for privacy"""
    print("\n[4] FACE BLUR DEMO")
    print("-" * 40)
    
    output_path = image_path.replace('.', '_blurred.')
    
    task = {
        'tool': 'face_blur',
        'image_path': image_path,
        'output_path': output_path,
        'query': 'blur faces in this image'
    }
    
    try:
        result = vision_worker.execute_face_blur(task)
        print_result("Face Blur", result)
        print(f"Blurred image saved to: {output_path}")
    except Exception as e:
        print(f"ERROR: {e}")


def demo_governance_blocks(vision_worker: VisionWorker):
    """Demo: Governance blocks prohibited queries"""
    print("\n[5] GOVERNANCE ENFORCEMENT DEMO")
    print("-" * 40)
    
    # Test forbidden queries
    forbidden_queries = [
        "identify this person",
        "who is this person",
        "find person in database",
    ]
    
    for query in forbidden_queries:
        task = {
            'tool': 'face_detect',
            'image_path': 'test.jpg',
            'query': query
        }
        
        try:
            vision_worker._check_governance(query, task)
            print(f"Query '{query}' - PASSED (unexpected)")
        except GovernanceError as e:
            print(f"Query '{query}' - BLOCKED: {e}")
        except Exception as e:
            print(f"Query '{query}' - ERROR: {e}")


def demo_audit_log(vision_worker: VisionWorker):
    """Demo: Audit logging"""
    print("\n[6] AUDIT LOG DEMO")
    print("-" * 40)
    
    logs = vision_worker.audit_log.get_logs(limit=10)
    
    if logs:
        print(f"Found {len(logs)} audit log entries:")
        for i, log in enumerate(logs[:5], 1):
            print(f"\n  Entry {i}:")
            print(f"    Action: {log.get('action')}")
            print(f"    Time: {log.get('timestamp')}")
    else:
        print("No audit logs found (run operations first)")


def create_sample_images():
    """Create placeholder test images if they don't exist."""
    print("\n[*] Checking for test images...")
    
    # Check if we have a test image
    test_dir = project_root / "images"
    test_dir.mkdir(exist_ok=True)
    
    sample_image = test_dir / "sample_face.jpg"
    sample_image2 = test_dir / "sample_face2.jpg"
    
    if not sample_image.exists():
        print(f"  Note: No sample images found in {test_dir}")
        print("  Please add test images to demo with real face photos")
        return None, None
    
    return str(sample_image), str(sample_image2)


def main():
    """Main demo function."""
    print("\n" + "="*60)
    print("AGENTARMY OS v7.6 - SAFE VISION DEMO")
    print("="*60)
    print("""
    This demo showcases privacy-preserving vision capabilities:
    - Face detection (count faces, get bounding boxes)
    - Face analysis (basic attributes)
    - Face comparison (user images only)
    - Face blur (privacy protection)
    
    Governance: All operations enforce:
    - User-supplied images only
    - No identification of individuals
    - No database matching
    - No surveillance
    
    Version: 7.6.0
    """)
    
    # Initialize VisionWorker
    print("\n[*] Initializing VisionWorker...")
    vision_worker = VisionWorker()
    
    # Check availability
    caps = vision_worker.get_capabilities()
    print(f"    Capabilities: {caps}")
    
    if not caps.get('full_vision'):
        print("\n[!] WARNING: Vision dependencies not fully available.")
        print("    Install with: pip install opencv-python face_recognition pillow")
    
    # Get sample images
    img1, img2 = create_sample_images()
    
    if img1:
        # Run demos
        demo_face_detect(vision_worker, img1)
        demo_face_analyze(vision_worker, img1)
        
        if img2:
            demo_face_compare(vision_worker, img1, img2)
        
        demo_face_blur(vision_worker, img1)
    else:
        print("\n[!] Skipping image demos (no test images)")
    
    # Governance demo always runs
    demo_governance_blocks(vision_worker)
    
    # Audit log demo
    demo_audit_log(vision_worker)
    
    print("\n" + "="*60)
    print("DEMO COMPLETE")
    print("="*60)
    print("""
    Next Steps:
    1. Add test images to images/ directory
    2. Install vision dependencies: pip install -r requirements.txt
    3. Run: python -m core.agent_army_os
    4. Access dashboard for visual results
    
    For v7.7 Facial Login (opt-in):
    5. Configure facial_login_policies in config/governance_config.yaml
    6. Set enabled: true after user opt-in
    """)


if __name__ == "__main__":
    main()

