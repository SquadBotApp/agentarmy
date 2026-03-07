import subprocess
import sys

def test_cli_provider_smoke():
    # Run the CLI with --help to ensure it loads
    result = subprocess.run([sys.executable, "cli/main.py", "--help"], capture_output=True, text=True)
    assert result.returncode == 0
    assert "Usage" in result.stdout or "usage" in result.stdout
