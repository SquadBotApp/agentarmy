import unittest

from integrations import build_social_intel


class TestSocialIntel(unittest.TestCase):
    def test_scores_official_verified_signal_as_credible(self):
        result = build_social_intel(
            {
                "goal": "defense",
                "profiles": [{"platform": "x", "handle": "@agentarmy"}],
                "signals": [
                    {
                        "source": "Official Blog",
                        "source_type": "official",
                        "claim": "Security bulletin posted",
                        "verified": True,
                        "corroboration_count": 3,
                        "evidence_quality": 0.9,
                        "recency_hours": 4,
                    }
                ],
            }
        )
        self.assertEqual(result["credibility_summary"]["credible_count"], 1)
        self.assertEqual(result["profiles"][0]["platform"], "x")

    def test_flags_unknown_source_type_in_policy_notes(self):
        result = build_social_intel(
            {
                "signals": [
                    {
                        "source": "Mystery Feed",
                        "source_type": "opaque",
                        "claim": "Unclear update",
                    }
                ]
            }
        )
        notes = " ".join(result["policy_notes"])
        self.assertIn("opaque", notes)


if __name__ == "__main__":
    unittest.main()
