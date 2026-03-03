import unittest
from unittest.mock import Mock, patch

from integrations import N8NAdapter


class TestN8NAdapter(unittest.TestCase):
    def test_trigger_skips_when_url_missing(self):
        adapter = N8NAdapter(webhook_url="")
        result = adapter.trigger("event", {"x": 1})
        self.assertEqual(result["status"], "skipped")

    @patch("orchestration.integrations.n8n_adapter.requests.post")
    def test_trigger_posts_payload(self, mock_post):
        mock_resp = Mock()
        mock_resp.ok = True
        mock_resp.status_code = 200
        mock_resp.text = "ok"
        mock_post.return_value = mock_resp

        adapter = N8NAdapter(webhook_url="http://example.com/hook", api_key="k1")
        result = adapter.trigger("agentarmy.workflow.completed", {"job": {"goal": "x"}}, workflow="claudebot")

        self.assertEqual(result["status"], "accepted")
        self.assertEqual(result["workflow"], "claudebot")
        self.assertTrue(mock_post.called)


if __name__ == "__main__":
    unittest.main()
