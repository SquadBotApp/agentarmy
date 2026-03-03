import unittest

from .response_utils import extract_json_payload


class TestResponseUtils(unittest.TestCase):
    def test_extract_json_from_fenced_block(self):
        payload = extract_json_payload("```json\n{\"ok\": true, \"n\": 1}\n```")
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["n"], 1)

    def test_extract_json_from_wrapped_text(self):
        payload = extract_json_payload("Result:\n{\"status\":\"completed\",\"value\":42}\nThanks.")
        self.assertEqual(payload["status"], "completed")
        self.assertEqual(payload["value"], 42)

    def test_extract_json_array(self):
        payload = extract_json_payload("prefix [1,2,3] suffix")
        self.assertEqual(payload, [1, 2, 3])


if __name__ == "__main__":
    unittest.main()
