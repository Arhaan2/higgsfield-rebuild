"""Isolated unit fixtures, never assignment evidence or repository log entries."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("capture", Path(__file__).with_name("capture.py"))
capture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(capture)


class CaptureTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="capture-unit-")
        self.root = Path(self.temp.name).resolve()
        self.payload = dict(cwd=str(self.root), session_id="unit-only-0001", turn_id="turn-1",
                            model="unit-fixture", hook_event_name="UserPromptSubmit",
                            prompt="  fixture\n\n`raw` — $value\n")

    def tearDown(self):
        self.temp.cleanup()

    def test_roundtrip_idempotence_and_switch(self):
        path = capture.capture(self.payload, self.root)
        before = path.read_bytes()
        capture.capture(self.payload, self.root)
        self.assertEqual(before, path.read_bytes())
        stop = dict(self.payload, hook_event_name="Stop", last_assistant_message=" answer\n\n")
        capture.capture(stop, self.root)
        text = path.read_text()
        self.assertIn(self.payload["prompt"] + "\n\n\n", text)
        self.assertIn(stop["last_assistant_message"] + "\n\n\n", text)
        capture.capture(dict(self.payload, turn_id="turn-2", model="changed-model"), self.root)
        text = path.read_text()
        self.assertIn("total_exchanges: 2", text)
        self.assertIn("model: changed-model", text)
        self.assertEqual(text.count("[LOG_ENTRY"), 3)

    def test_missing_prompt_rejected(self):
        with self.assertRaisesRegex(ValueError, "no automatically captured prompt"):
            capture.capture(dict(self.payload, hook_event_name="Stop", last_assistant_message="fixture"), self.root)
        self.assertFalse((self.root / ".agent-logs").exists())

    def test_edit_rejected(self):
        path = capture.capture(self.payload, self.root)
        path.write_text(path.read_text().replace("fixture", "altered"))
        with self.assertRaisesRegex(ValueError, "changed"):
            capture.capture(dict(self.payload, turn_id="turn-2"), self.root)

    def test_no_extra_payload_fields(self):
        payload = dict(self.payload, tool_input="EXCLUDED_TOOL", reasoning="EXCLUDED_REASONING")
        path = capture.capture(payload, self.root)
        self.assertNotIn("EXCLUDED", path.read_text())
        journal = next((self.root / ".cache" / "agent-capture").glob("*.jsonl"))
        self.assertNotIn("EXCLUDED", journal.read_text())

    def test_other_root_rejected(self):
        with self.assertRaisesRegex(ValueError, "destination mismatch"):
            capture.capture(dict(self.payload, cwd="/tmp"), self.root)


if __name__ == "__main__":
    unittest.main()
