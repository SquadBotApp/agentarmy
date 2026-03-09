#!/usr/bin/env python3
"""
AgentArmy OS - First-Run Setup Wizard
=====================================
Initializes the environment, creates the first user, and launches the dashboard.

Usage:
    python -m scripts.setup
    python -m scripts.setup --skip-wizard
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def get_agentarmy_dir() -> Path:
    """Get or create AgentArmy directory."""
    if os.name == 'nt':  # Windows
        base = Path(os.environ.get('LOCALAPPDATA', Path.home()))
        agentarmy_dir = base / 'AgentArmyOS'
    else:  # Unix-like
        agentarmy_dir = Path.home() / '.agentarmy'
    
    agentarmy_dir.mkdir(parents=True, exist_ok=True)
    return agentarmy_dir


def create_config(agentarmy_dir: Path) -> None:
    """Create default configuration files."""
    config = {
        "version": "7.8.0",
        "created_at": datetime.now().isoformat(),
        "api": {
            "host": "0.0.0.0",
            "port": 5000,
            "debug": False
        },
        "dashboard": {
            "host": "0.0.0.0",
            "port": 8501
        },
        "security": {
            "password_min_length": 8,
            "session_expiry_days": 7,
            "mfa_enabled": False,
            "facial_login_enabled": False
        },
        "governance": {
            "vision_enabled": True,
            "db_match_allowed": False,
            "identification_allowed": False
        },
        "storage": {
            "memory_dir": str(agentarmy_dir / "memory"),
            "templates_dir": str(agentarmy_dir / "templates"),
            "logs_dir": str(agentarmy_dir / "logs")
        }
    }
    
    config_path = agentarmy_dir / "config.yaml"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"✓ Created config: {config_path}")


def create_directories(agentarmy_dir: Path) -> None:
    """Create necessary directories."""
    dirs = [
        "memory",
        "templates",
        "logs",
        "cache"
    ]
    
    for d in dirs:
        (agentarmy_dir / d).mkdir(exist_ok=True)
        print(f"✓ Created directory: {d}")


def create_governance_rules(agentarmy_dir: Path) -> None:
    """Create default governance rules."""
    rules = {
        "vision_policies": {
            "allowed": True,
            "user_images_only": True,
            "db_match": False,
            "identification": False
        },
        "facial_login_policies": {
            "enabled": True,
            "opt_in_required": True,
            "consent_required": True,
            "local_storage_only": True
        },
        "forbidden_queries": [
            "identify this person",
            "who is this",
            "find this person",
            "match to database",
            "surveillance"
        ]
    }
    
    rules_path = agentarmy_dir / "governance.json"
    with open(rules_path, 'w') as f:
        json.dump(rules, f, indent=2)
    
    print(f"✓ Created governance rules: {rules_path}")


def init_user_db(agentarmy_dir: Path) -> None:
    """Initialize empty user database."""
    db_data = {
        "version": "1.0",
        "created_at": datetime.now().isoformat(),
        "users": {}
    }
    
    db_path = agentarmy_dir / "memory" / "users.json"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    if not db_path.exists():
        with open(db_path, 'w') as f:
            json.dump(db_data, f, indent=2)
        print(f"✓ Created user database: {db_path}")


def create_audit_log(agentarmy_dir: Path) -> None:
    """Create audit log file."""
    log_path = agentarmy_dir / "logs" / "audit.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    
    if not log_path.exists():
        with open(log_path, 'w') as f:
            f.write(f"# AgentArmy OS Audit Log\n")
            f.write(f"# Created: {datetime.now().isoformat()}\n\n")
        print(f"✓ Created audit log: {log_path}")


def create_first_user(agentarmy_dir: Path) -> bool:
    """Interactive first user creation."""
    print("\n" + "="*50)
    print("CREATE YOUR ACCOUNT")
    print("="*50)
    
    # Get username
    while True:
        username = input("Username: ").strip()
        if username:
            if len(username) < 3:
                print("Username must be at least 3 characters")
                continue
            break
        print("Username is required")
    
    # Get email
    while True:
        email = input("Email: ").strip()
        if email and '@' in email:
            break
        print("Valid email is required")
    
    # Get password
    while True:
        password = input("Password: ").strip()
        if len(password) < 8:
            print("Password must be at least 8 characters")
            continue
        confirm = input("Confirm Password: ").strip()
        if password == confirm:
            break
        print("Passwords don't match")
    
    # Create user
    try:
        from core.services.user_db import get_user_db
        user_db = get_user_db()
        
        result = user_db.create_user(username, email, password, segment="production")
        
        if result.get("status") == "success":
            print(f"\n✓ Account created successfully!")
            print(f"  Username: {username}")
            print(f"  Email: {email}")
            
            # Ask about MFA
            mfa_choice = input("\nEnable MFA (email-based)? (y/n): ").strip().lower()
            if mfa_choice == 'y':
                try:
                    mfa_result = user_db.enable_mfa(username)
                    print(f"✓ MFA enabled")
                    print(f"  Secret: {mfa_result.get('secret', 'N/A')}")
                except ImportError:
                    print("  Note: Install pyotp for full MFA support")
            
            # Ask about facial login
            print("\n" + "-"*50)
            print("SECURITY OPTIONS")
            print("-"*50)
            print("Facial login is OPTIONAL and disabled by default.")
            print("You can enable it later from the dashboard.")
            
            return True
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"Error creating user: {e}")
        return False


def check_environment() -> dict:
    """Check environment and dependencies."""
    checks = {
        "python": sys.version_info >= (3, 9),
        "memory_dir": True,
        "packages": {}
    }
    
    # Check key packages
    packages = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "uvicorn"),
        ("pydantic", "Pydantic"),
        ("pyyaml", "PyYAML")
    ]
    
    for module, name in packages:
        try:
            __import__(module)
            checks["packages"][name] = True
        except ImportError:
            checks["packages"][name] = False
    
    return checks


def print_status(checks: dict) -> None:
    """Print environment status."""
    print("\n" + "="*50)
    print("ENVIRONMENT CHECK")
    print("="*50)
    
    for key, value in checks.items():
        if key == "packages":
            for pkg, installed in value.items():
                status = "✓" if installed else "✗"
                print(f"  {status} {pkg}: {'OK' if installed else 'MISSING'}")
        else:
            status = "✓" if value else "✗"
            print(f"  {status} {key}")


def run_wizard() -> None:
    """Run the full setup wizard."""
    print("\n" + "="*50)
    print("AGENTARMY OS - FIRST-RUN SETUP")
    print("="*50)
    print("Welcome! Let's set up your environment.\n")
    
    # Get agentarmy directory
    agentarmy_dir = get_agentarmy_dir()
    print(f"AgentArmy directory: {agentarmy_dir}")
    
    # Check environment
    checks = check_environment()
    print_status(checks)
    
    # Create directories
    print("\n" + "="*50)
    print("CREATING DIRECTORIES")
    print("="*50)
    create_directories(agentarmy_dir)
    
    # Create config
    print("\n" + "="*50)
    print("CREATING CONFIGURATION")
    print("="*50)
    create_config(agentarmy_dir)
    create_governance_rules(agentarmy_dir)
    
    # Initialize database
    print("\n" + "="*50)
    print("INITIALIZING DATABASE")
    print("="*50)
    init_user_db(agentarmy_dir)
    create_audit_log(agentarmy_dir)
    
    # Create first user
    print("\n" + "="*50)
    create_first_user(agentarmy_dir)
    
    # Print next steps
    print("\n" + "="*50)
    print("SETUP COMPLETE!")
    print("="*50)
    print("\nNext steps:")
    print("  1. Start the API server:")
    print("     python -m api.main")
    print("\n  2. Start the dashboard:")
    print("     python -m dashboard.ui")
    print("\n  3. Or use the CLI:")
    print("     agentarmy login")
    print("\n" + "="*50)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="AgentArmy OS Setup")
    parser.add_argument("--skip-wizard", action="store_true", 
                       help="Skip interactive wizard")
    args = parser.parse_args()
    
    if args.skip_wizard:
        # Non-interactive setup
        agentarmy_dir = get_agentarmy_dir()
        create_directories(agentarmy_dir)
        create_config(agentarmy_dir)
        create_governance_rules(agentarmy_dir)
        init_user_db(agentarmy_dir)
        create_audit_log(agentarmy_dir)
        print("Setup complete!")
    else:
        run_wizard()


if __name__ == "__main__":
    main()
