import unittest

from integrations import build_ssh_plan


class TestSshHub(unittest.TestCase):
    def test_marks_password_auth_as_risky(self):
        result = build_ssh_plan(
            {
                "profiles": [
                    {
                        "host": "10.0.0.12",
                        "profile_type": "linux_server",
                        "auth_mode": "password",
                        "controls": ["host_key_pinning"],
                    }
                ]
            }
        )
        self.assertEqual(result["summary"]["total_profiles"], 1)
        self.assertGreaterEqual(result["profiles"][0]["risk_score"], 0.7)
        self.assertFalse(result["profiles"][0]["ready"])

    def test_profile_ready_when_controls_and_key_auth_present(self):
        result = build_ssh_plan(
            {
                "profiles": [
                    {
                        "host": "10.0.0.10",
                        "profile_type": "linux_server",
                        "auth_mode": "ed25519_key",
                        "controls": ["host_key_pinning", "least_privilege_user"],
                    }
                ]
            }
        )
        self.assertEqual(result["summary"]["ready_profiles"], 1)
        self.assertTrue(result["profiles"][0]["ready"])


if __name__ == "__main__":
    unittest.main()
