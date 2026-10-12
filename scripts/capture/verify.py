#!/usr/bin/env python3
"""Read-only comparison of published capture with actual local Codex sources."""
import hashlib
import json
from pathlib import Path
import re

from capture import ROOT, render, utc_now


def audit():
    reports = []
    for log in sorted((ROOT / '.agent-logs').glob('*.md')):
        published = log.read_bytes().decode('utf-8')
        sid = re.search(r'^session_id: (.+)$', published, re.M)[1]
        journal = ROOT / '.cache' / 'agent-capture' / (sid + '.jsonl')
        provenance = ROOT / 'docs' / 'capture' / 'provenance' / (sid + '.json')
        sources = list(Path('/Users/arhaan/.codex/sessions').rglob('*' + sid + '*.jsonl'))
        assert len(sources) == 1, f'Ambiguous source: {sid}'
        lines = sources[0].read_bytes().splitlines()
        records = [json.loads(line) for line in lines]
        if journal.exists():
            mechanism = 'native lifecycle hooks'
            events = [json.loads(line) for line in journal.read_text().splitlines()]
            assert published == ''.join(render(events)), f'Native journal mismatch: {sid}'
            source_texts = []
            for record in records:
                p = record.get('payload', {})
                if record['type'] != 'response_item' or p.get('type') != 'message':
                    continue
                m = p.get('internal_chat_message_metadata_passthrough', {})
                if p.get('role') == 'user' and 'user.text' in m.get('content_item_kinds', []):
                    source_texts.append(('PROMPT', p['content'][0]['text']))
                elif p.get('role') == 'assistant' and p.get('phase') == 'final_answer':
                    source_texts.append(('RESPONSE', p['content'][0]['text']))
            assert [(e['kind'], e['text']) for e in events] == source_texts, f'Source text mismatch: {sid}'
        else:
            mechanism = 'automatic source transcript extraction'
            proof = json.loads(provenance.read_text())
            events = []
            num = 0
            for entry in proof['entries']:
                r = records[entry['source_line'] - 1]
                p = r['payload']
                if p['type'] == 'message':
                    text = p['content'][0]['text']
                else:
                    text = re.fullmatch(r'<codex_delegation>\n  <source_thread_id>[^<]+</source_thread_id>\n  <input>([\s\S]*)</input>\n</codex_delegation>\n?', p['output'])[1]
                assert hashlib.sha256(text.encode()).hexdigest() == entry['text_sha256']
                if entry['type'] == 'PROMPT':
                    num += 1
                models = [r['payload']['model'] for r in records
                          if r['type'] == 'turn_context' and r['payload'].get('turn_id') == entry['turn_id']]
                assert models and len(set(models)) == 1
                events.append(dict(session_id=sid,kind=entry['type'],num=num,model=models[0],
                                   timestamp=entry['timestamp'],text=text))
            assert published == ''.join(render(events)), f'Export source mismatch: {sid}'
        source_models = {r['payload'].get('model') for r in records if r['type'] == 'turn_context'}
        assert all(e['model'] in source_models for e in events)
        prompts = sum(e['kind'] == 'PROMPT' for e in events)
        responses = sum(e['kind'] == 'RESPONSE' for e in events)
        reports.append(dict(session_id=sid, log=str(log.relative_to(ROOT)), mechanism=mechanism,
                            source=str(sources[0]), prompts=prompts, responses=responses,
                            source_text_exact_match=True, models=sorted(source_models),
                            sha256=hashlib.sha256(log.read_bytes()).hexdigest()))
    return dict(verified_at=utc_now(), sessions=reports)


if __name__ == '__main__':
    print(json.dumps(audit(), indent=2))
