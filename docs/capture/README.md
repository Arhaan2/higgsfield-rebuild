# Local capture operation

The installed setup is specific to `/Users/arhaan/Desktop/higgsfield-rebuild`, Codex 0.160.0, and the current Mac. See root `CAPTURE-TEST.md` for actual canaries and failures.

- CLI sessions use native prompt/stop hooks in `.codex/hooks.json`. Codex's `/hooks` interface has saved trust for both definitions. Local recovery journals and locks are under ignored `.cache/agent-capture/`; preserve them while continuing these sessions.
- Desktop sessions use the user LaunchAgent `com.arhaan.higgsfield-capture`. Its installed plist is in `~/Library/LaunchAgents/`; a reviewable copy is in `scripts/capture/`. The daemon reads new source records every two seconds and publishes only prompts and final answers. It also runs after this chat finishes and after login.
- Raw message bodies are preserved. Only generated frontmatter counters/timestamps are refreshed as the session grows. Existing entry bodies must remain an exact prefix; conflicting history raises an error instead of being overwritten.
- Source extraction metadata lives in `docs/capture/provenance/`. Source JSONL files remain in the user's local Codex store and are not copied into the public repository because they contain excluded tool and reasoning traffic.
- Initial setup-source extraction and the two originally failed exec attempts are labeled in the report. Their actual on-disk text was extracted automatically; no historical prompt or answer was invented.
- Native collaboration children have encrypted prompts in the observed store and remain unsupported. Do not use them for production yet. Worktrees and moved project roots are also unverified.
- Text shapes outside the observed format and new Codex versions require revalidation. No provider spending is configured or authorized by capture setup.

Read-only checks:

```sh
cd /Users/arhaan/Desktop/higgsfield-rebuild
cat .cache/agent-capture/exporter-status.json
PYTHONDONTWRITEBYTECODE=1 python3 scripts/capture/verify.py
git status --short
```

These checks do not perform capture. Capture runs automatically through the native hooks and LaunchAgent.

If the exporter reports an error, preserve the existing logs and original transcript, resolve the exact schema/process issue, and repeat independent canaries. Do not edit an entry to make verification pass. A native hook definition change needs review again in `/hooks`.

The initial guide was a user-supplied attachment. `official-capture-guide.txt` is an exact copy for review; it is not a session-log placeholder.
