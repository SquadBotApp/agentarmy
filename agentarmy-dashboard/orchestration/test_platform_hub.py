import unittest
from unittest.mock import Mock, patch

from integrations import SUPPORTED_PLATFORMS, PlatformHub


class TestPlatformHub(unittest.TestCase):
    def test_supported_platforms_contains_all_requested(self):
        expected = {
            "agentforce_360",
            "microsoft_copilot_studio",
            "ibm_watsonx_assistant",
            "openai_codex",
            "roo_code",
            "google_jules",
            "hashbrown",
            "project_astra",
            "yellow_ai",
            "moveworks",
            "aws_q_dev",
            "sap_joule",
            "apple_mobile",
            "samsung_mobile",
            "google_mobile",
            "amazon_mobile",
        }
        self.assertTrue(expected.issubset(set(SUPPORTED_PLATFORMS.keys())))

    def test_resolve_mobile_targets(self):
        hub = PlatformHub()
        targets = hub.resolve_mobile_targets(["apple", "google", "apple", "unknown"])
        self.assertEqual(targets, ["apple_mobile", "google_mobile"])

    @patch("integrations.platform_hub.requests.post")
    @patch("integrations.platform_hub.os.getenv")
    def test_dispatch_one_posts_when_configured(self, mock_getenv, mock_post):
        def fake_getenv(key, default=""):
            if key == "OPENAI_CODEX_WEBHOOK_URL":
                return "https://example.test/codex"
            if key == "OPENAI_CODEX_API_KEY":
                return "secret"
            return default

        mock_getenv.side_effect = fake_getenv
        mock_resp = Mock()
        mock_resp.ok = True
        mock_resp.status_code = 200
        mock_resp.text = "ok"
        mock_post.return_value = mock_resp

        hub = PlatformHub()
        result = hub.dispatch(
            "agentarmy.workflow.completed",
            {"job": {"goal": "x"}},
            ["openai_codex"],
        )

        self.assertEqual(result["openai_codex"]["status"], "accepted")
        self.assertTrue(mock_post.called)


if __name__ == "__main__":
    unittest.main()
