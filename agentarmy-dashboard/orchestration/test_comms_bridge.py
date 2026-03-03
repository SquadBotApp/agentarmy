import unittest
from unittest.mock import patch

from integrations import broadcast_comms


class TestCommsBridge(unittest.TestCase):
    def test_alias_resolution_and_dispatch(self):
        with patch("orchestration.integrations.comms_bridge.PlatformHub.dispatch", return_value={
            "threecx_phone": {"status": "accepted"},
            "claude_channel": {"status": "accepted"},
            "microsoft_copilot_studio": {"status": "skipped"},
        }):
            result = broadcast_comms(
                {
                    "message": "Bridge check",
                    "targets": ["3cx", "claude", "copy"],
                }
            )
        self.assertEqual(result["status"], "completed")
        self.assertIn("threecx_phone", result["targets"])
        self.assertIn("claude_channel", result["targets"])
        self.assertIn("microsoft_copilot_studio", result["targets"])

    def test_requires_message(self):
        result = broadcast_comms({"targets": ["3cx"]})
        self.assertEqual(result["status"], "failed")
        self.assertIn("message is required", result["error"])


if __name__ == "__main__":
    unittest.main()
