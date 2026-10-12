#!/usr/bin/env python3
"""Codex 0.160 lifecycle capture. No network, transcript scraping, or tool logging.

Only the native UserPromptSubmit.prompt and Stop.last_assistant_message are saved.
The local journal permits idempotent recovery; published entry bodies are immutable.
"""

import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
AUTHOR = "Arhaan2"  # Verified with gh api user during setup.


def utc_now():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def atomic_write(path, content):
    fd, name = tempfile.mkstemp(dir=path.parent, prefix=".capture-")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def render(events):
    first = events[0]
    prompts = [e for e in events if e["kind"] == "PROMPT"]
    sid = first["session_id"]
    date = first["timestamp"][:10]
    header = (
        f"---\nsession_id: {sid}\ndate: {date}\nauthor: {AUTHOR}\n"
        f"model: {first['model']}\ntool: codex\nproject: higgsfield-rebuild\n"
        f"total_exchanges: {len(prompts)}\nfirst_prompt_time: {prompts[0]['timestamp']}\n"
        f"last_prompt_time: {prompts[-1]['timestamp']}\n---\n\n"
        f"# Session Log - {date}\n\n"
        f"Session: `{sid[:8]}` | Project: `higgsfield-rebuild` | Author: `{AUTHOR}`\n\n---\n\n"
    )
    body = "".join(
        f"[LOG_ENTRY type={e['kind']} num={e['num']} session={sid[:8]}]\n"
        f"timestamp: {e['timestamp']}\nmodel: {e['model']}\n\n{e['text']}\n\n\n"
        for e in events
    )
    return header, body


def capture(payload, root=ROOT):
    event_name = payload.get("hook_event_name")
    if event_name not in ("UserPromptSubmit", "Stop"):
        raise ValueError("Unsupported hook event")
    # Refuse to redirect captures into a worktree or a different project.
    if Path(payload["cwd"]).resolve() != root.resolve():
        raise ValueError("Capture destination mismatch: worktree coverage is not verified")
    sid, turn, model = (payload[k] for k in ("session_id", "turn_id", "model"))
    if not re.fullmatch(r"[a-zA-Z0-9-]{8,80}", sid):
        raise ValueError("Invalid session identity")
    if not turn or not re.fullmatch(r"[a-zA-Z0-9_.:/-]+", model):
        raise ValueError("Missing turn identity or invalid model")
    kind = "PROMPT" if event_name == "UserPromptSubmit" else "RESPONSE"
    content = payload.get("prompt" if kind == "PROMPT" else "last_assistant_message")
    if not isinstance(content, str) or not content:
        raise ValueError("Native hook did not provide nonempty prompt/final response")
    state = root / ".cache" / "agent-capture"
    state.mkdir(parents=True, exist_ok=True)
    journal = state / f"{sid}.jsonl"
    with (state / f"{sid}.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        events = [json.loads(line) for line in journal.read_text().splitlines()] if journal.exists() else []
        key = f"{turn}:{kind}:" + hashlib.sha256(content.encode()).hexdigest()
        duplicate = any(e["key"] == key for e in events)
        if not duplicate:
            prompts = [e for e in events if e["kind"] == "PROMPT"]
            if kind == "RESPONSE":
                matches = [e for e in prompts if e["turn_id"] == turn]
                if not matches:
                    raise ValueError("Response has no automatically captured prompt; refusing reconstruction")
                num = matches[-1]["num"]
                if any(e["kind"] == kind and e["turn_id"] == turn for e in events):
                    raise ValueError("A different final response already exists for this turn")
            else:
                num = len(prompts) + 1
            event = dict(key=key, session_id=sid, turn_id=turn, model=model, kind=kind,
                         num=num, timestamp=utc_now(), text=content)
            # Verify published history BEFORE extending the journal.
            if events:
                verify_published(root, events)
            with journal.open("a", encoding="utf-8", newline="") as f:
                f.write(json.dumps(event, ensure_ascii=False) + "\n")
                f.flush()
                os.fsync(f.fileno())
            events.append(event)
        output = log_path(root, events)
        output.parent.mkdir(exist_ok=True)
        header, body = render(events)
        if output.exists():
            old_body = output.read_bytes().decode("utf-8").split("\n\n---\n\n", 1)[1]
            if not body.startswith(old_body):
                raise ValueError("Existing log differs from captured history; refusing overwrite")
        atomic_write(output, header + body)
        return output


def log_path(root, events):
    first = events[0]
    stamp = first["timestamp"][:19].replace("T", "_").replace(":", "-")
    return root / ".agent-logs" / f"{stamp}_{first['session_id']}.md"


def verify_published(root, events):
    output = log_path(root, events)
    if output.exists() and output.read_bytes().decode("utf-8") != "".join(render(events)):
        raise ValueError("Published log was changed or journal recovery is required")


def main():
    try:
        capture(json.load(sys.stdin))
        print("{}")
    except Exception as error:
        # No payload text in diagnostics. Make capture failures visible.
        print(json.dumps({"systemMessage": f"Agent capture FAILED: {error}"}))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
