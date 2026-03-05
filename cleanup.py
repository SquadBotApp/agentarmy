import os
import shutil

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Files and directories to remove (Legacy/Obsolete)
    removables = [
        "app.py",
        "sim_engine.py",
        "task.py",
        "agent.py",
        "core/orchestrator.py",
        "api",
        "agentarmy-dashboard",
        "dashboard", # Remove the old dashboard directory to avoid conflicts with dashboard.py
        "run_agentarmy.py", # Obsolete runner
        "tests/test_api_smoke.py",
        "tests/test_cli_smoke.py",
        "server_test_results.txt",
        "orchestration_test_results.txt",
        # Unify provider model by removing old versions
        "providers/base.py",
        "providers/openai.py",
        "providers/claude.py",
        "integration/router.py",
        "integration/providers/claude.py",
        "integration/providers/gemini.py",
        "integration/providers/openai.py",
        "core/router.py",
    ]

    print(f"--- Agent Army Cleanup ---")
    print(f"Working directory: {root_dir}")

    for item in removables:
        path = os.path.join(root_dir, item)
        if os.path.exists(path):
            if os.path.isdir(path):
                shutil.rmtree(path)
                print(f"[DELETED] Directory: {item}")
            else:
                os.remove(path)
                print(f"[DELETED] File: {item}")

    # Ensure templates directory exists
    templates_dir = os.path.join(root_dir, "templates")
    if not os.path.exists(templates_dir):
        os.makedirs(templates_dir)
        print("[CREATED] templates/ directory")

    # Move dashboard.html to templates/
    src_html = os.path.join(root_dir, "dashboard.html")
    dst_html = os.path.join(templates_dir, "dashboard.html")
    
    if os.path.exists(src_html):
        shutil.move(src_html, dst_html)
        print(f"[MOVED] dashboard.html -> templates/dashboard.html")
    
    print("\nCleanup complete. System is ready for deployment.")

if __name__ == "__main__":
    main()