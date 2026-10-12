"""Fixtures are used only in memory or temporary directories, never as evidence."""
import json
from pathlib import Path
import tempfile
import unittest
from export_sessions import ROOT, parse_source, publish


class ExportTests(unittest.TestCase):
    def fixture(self):
        def message(role, text, kinds, phase=None):
            return {'timestamp':'2026-10-12T01:00:00.000Z', 'type':'response_item', 'payload':{
                'type':'message', 'role':role, 'phase':phase, 'id':'fixture-id',
                'internal_chat_message_metadata_passthrough':{'turn_id':'fixture-turn', 'content_item_kinds':kinds},
                'content':[{'type':'input_text' if role=='user' else 'output_text', 'text':text}]}}
        return [
            {'type':'session_meta','payload':{'cwd':str(ROOT),'timestamp':'2026-10-12T00:00:00Z',
             'source':'vscode','id':'fixture-session','cli_version':'0.160.0'}},
            {'type':'turn_context','payload':{'turn_id':'fixture-turn','model':'fixture-model'}},
            message('user','NOT A PROMPT',['agents_md.instructions']),
            message('user','  raw\r\ntext\n',['user.text']),
            message('assistant','NOT FINAL',[], 'commentary'),
            message('assistant',' exact final\n',[], 'final_answer')]

    def test_selective_exact_capture_and_prefix_protection(self):
        raw = b''.join((json.dumps(e)+'\n').encode() for e in self.fixture())
        events, provenance = parse_source(raw, Path('/tmp/unit-only.jsonl'))
        self.assertEqual([e['text'] for e in events], ['  raw\r\ntext\n', ' exact final\n'])
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            publish(events,provenance,root)
            path=next((root/'.agent-logs').glob('*.md'))
            self.assertIn(b'  raw\r\ntext\n',path.read_bytes())
            publish(events,provenance,root)
            events[0]['text']='changed'
            with self.assertRaisesRegex(ValueError,'diverged'):
                publish(events,provenance,root)

    def test_partial_write_ignored(self):
        raw=b''.join((json.dumps(e)+'\n').encode() for e in self.fixture())+b'{"partial"'
        self.assertEqual(len(parse_source(raw,Path('/tmp/unit-only'))[0]),2)

    def test_unknown_version_rejected(self):
        records=self.fixture();records[0]['payload']['cli_version']='future'
        raw=b''.join((json.dumps(e)+'\n').encode() for e in records)
        with self.assertRaisesRegex(ValueError,'Untested'):
            parse_source(raw,Path('/tmp/unit-only'))

    def test_native_delegation_input_preserved(self):
        records=self.fixture()
        message=records[3]['payload']
        records[3]['payload']={'type':'function_call_output','namespace':'codex_app',
            'name':'create_thread','id':'fixture-delegation',
            'internal_chat_message_metadata_passthrough':message['internal_chat_message_metadata_passthrough'],
            'output':'<codex_delegation>\n  <source_thread_id>fixture-parent</source_thread_id>\n  <input> raw </input> text\n</input>\n</codex_delegation>\n'}
        raw=b''.join((json.dumps(e)+'\n').encode() for e in records)
        events,_=parse_source(raw,Path('/tmp/unit-only'))
        self.assertEqual(events[0]['text'],' raw </input> text\n')


if __name__ == '__main__':
    unittest.main()
