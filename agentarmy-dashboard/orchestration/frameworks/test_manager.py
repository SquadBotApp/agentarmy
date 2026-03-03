import asyncio
import unittest

try:
    from orchestration.frameworks import get_framework_adapter, normalize_framework_name
except Exception:  # pragma: no cover
    from frameworks import get_framework_adapter, normalize_framework_name


class FrameworkManagerTest(unittest.TestCase):
    def test_normalize_supports_frabric_alias(self):
        self.assertEqual(normalize_framework_name("frabric"), "frabric")
        self.assertEqual(normalize_framework_name("fabric"), "frabric")

    def test_get_frabric_adapter(self):
        adapter = get_framework_adapter("frabric")
        self.assertEqual(adapter.framework_name, "frabric")
        self.assertEqual(adapter.coordination_mode, "policy_fabric")

    def test_frabric_run_adds_fabric_meta(self):
        async def native_execute(_task):
            return {"status": "completed", "content": "ok"}

        async def run_test():
            adapter = get_framework_adapter("frabric")
            result = await adapter.run(
                role="executor",
                task_spec={"description": "test", "requires_approval": True},
                context={"governor_hook": lambda *_: {"blocked": False}},
                native_execute=native_execute,
            )
            self.assertEqual(result["framework"]["framework"], "frabric")
            self.assertIn("fabric_meta", result["framework"])
            self.assertTrue(result["framework"]["fabric_meta"]["approval_required"])

        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main()
