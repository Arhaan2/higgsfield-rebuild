#!/usr/bin/env python3
"""Automatic, provenance-preserving export of Codex Desktop text turns.

Codex 0.160 JSONL is version-dependent, not a stable API. Unsupported records fail
closed. CLI sessions (interactive and exec) use the native hooks instead. Encrypted child
prompts are explicitly unsupported; no ciphertext or reconstructed prompt is logged.
"""
import datetime as dt
import fcntl
import hashlib
import json
from pathlib import Path
import re
import sys
import time

from capture import ROOT, atomic_write, log_path, render, utc_now

SESSIONS = Path('/Users/arhaan/.codex/sessions')
START = '2026-10-11T23:53:42.615Z'


def text_only(content, expected):
    if len(content) != 1 or content[0].get('type') != expected:
        raise ValueError('Unsupported message content shape; inspect the source without editing logs')
    value = content[0].get('text')
    if not isinstance(value, str):
        raise ValueError('Missing source text')
    return value


def parse_source(raw, path):
    records = []
    # Ignore an incomplete final write until the next poll.
    for n, line in enumerate(raw.splitlines(keepends=True), 1):
        if not line.endswith(b'\n'):
            break
        records.append((n, json.loads(line)))
    if not records or records[0][1].get('type') != 'session_meta':
        return [], None
    meta = records[0][1]['payload']
    if meta.get('cwd') != str(ROOT) or meta.get('timestamp', '') < START:
        return [], None
    if meta.get('source') != 'vscode':
        return [], None
    if meta.get('cli_version') != '0.160.0':
        raise ValueError('Untested Codex transcript version; capture needs revalidation')
    models = {}
    events, provenance = [], []
    prompt_nums = {}
    for line_number, record in records:
        payload = record.get('payload', {})
        if record['type'] == 'turn_context':
            models[payload.get('turn_id')] = payload.get('model')
        if record['type'] != 'response_item':
            continue
        metadata = payload.get('internal_chat_message_metadata_passthrough', {})
        kinds = metadata.get('content_item_kinds', [])
        role = payload.get('role')
        delegated = None
        if (payload.get('type') == 'function_call_output' and
                payload.get('namespace') == 'codex_app' and
                payload.get('name') in ('create_thread', 'send_message_to_thread')):
            delegated = re.fullmatch(
                r'<codex_delegation>\n  <source_thread_id>[a-zA-Z0-9-]+</source_thread_id>\n'
                r'  <input>([\s\S]*)</input>\n</codex_delegation>\n?', payload.get('output', ''))
            if not delegated:
                raise ValueError('Unrecognized source delegation envelope')
            kind, content_type = 'PROMPT', None
        elif payload.get('type') != 'message':
            continue
        elif role == 'user' and 'user.text' in kinds:
            kind, content_type = 'PROMPT', 'input_text'
        elif role == 'assistant' and payload.get('phase') == 'final_answer':
            kind, content_type = 'RESPONSE', 'output_text'
        else:
            continue
        turn = metadata.get('turn_id')
        model = models.get(turn)
        if not turn or not model:
            raise ValueError('Missing source turn/model; refusing guessed metadata')
        # Only the exact submitted input, not the surrounding tool traffic.
        text = delegated.group(1) if delegated else text_only(payload['content'], content_type)
        if kind == 'PROMPT':
            num = sum(e['kind'] == 'PROMPT' for e in events) + 1
            prompt_nums[turn] = num
        elif turn in prompt_nums:
            num = prompt_nums[turn]
        else:
            raise ValueError('Source final has no eligible source prompt')
        event = dict(session_id=meta['id'], turn_id=turn, kind=kind, num=num,
                     model=model, timestamp=record['timestamp'], text=text)
        events.append(event)
        provenance.append(dict(type=kind, turn_id=turn, source_line=line_number,
                               source_item_id=payload.get('id'), timestamp=record['timestamp'],
                               text_sha256=hashlib.sha256(text.encode()).hexdigest()))
    if not events:
        return [], None
    return events, dict(source_path=str(path), source_format='Codex 0.160.0 rollout JSONL',
                        extraction='Automatic source transcript extraction; not a retroactive hook event',
                        session_id=meta['id'], source_originator=meta.get('originator'),
                        source_session_start=meta['timestamp'], entries=provenance)


def publish(events, provenance, root=ROOT):
    target = log_path(root, events)
    header, body = render(events)
    if target.exists():
        old = target.read_bytes().decode('utf-8')
        old_body = old.split('\n\n---\n\n', 1)[1]
        if not body.startswith(old_body):
            raise ValueError('Published entries diverged from source; refusing modification')
        if old == header + body:
            return
    target.parent.mkdir(exist_ok=True)
    atomic_write(target, header + body)
    evidence = root / 'docs' / 'capture' / 'provenance'
    evidence.mkdir(parents=True, exist_ok=True)
    evidence_path = evidence / (events[0]['session_id'] + '.json')
    provenance['exported_at'] = utc_now()
    provenance['published_path'] = str(target.relative_to(root))
    atomic_write(evidence_path, json.dumps(provenance, indent=2) + '\n')


def run():
    state = ROOT / '.cache' / 'agent-capture'
    state.mkdir(parents=True, exist_ok=True)
    with (state / 'exporter.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        signatures = {}
        while True:
            errors = []
            scanned = 0
            for path in SESSIONS.rglob('rollout-*.jsonl'):
                stat = path.stat()
                if stat.st_mtime < 1791762822:
                    continue
                scanned += 1
                signature = (stat.st_size, stat.st_mtime_ns)
                if signatures.get(path) == signature:
                    continue
                try:
                    events, provenance = parse_source(path.read_bytes(), path)
                    if events:
                        publish(events, provenance)
                    signatures[path] = signature
                except Exception as error:
                    errors.append({'source': str(path), 'error': str(error)})
            atomic_write(state / 'exporter-status.json', json.dumps(dict(
                checked_at=utc_now(), scanned=scanned, errors=errors,
                unsupported='Encrypted native child prompts and worktrees are not verified'
            ), indent=2) + '\n')
            time.sleep(2)


if __name__ == '__main__':
    run()
