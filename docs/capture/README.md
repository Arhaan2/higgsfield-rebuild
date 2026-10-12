# Local capture operation

The installed setup is specific to `/Users/arhaan/Desktop/higgsfield-rebuild`, Codex 0.160.0 and revalidated 0.162.0-alpha.17.2, and the current Mac. See root `CAPTURE-TEST.md` for actual canaries and failures.

- CLI sessions use native prompt/stop hooks in `.codex/hooks.json`. Codex's `/hooks` interface has saved trust for both definitions. Local recovery journals and locks are under ignored `.cache/agent-capture/`; preserve them while continuing these sessions.
- Desktop sessions use the user LaunchAgent `com.arhaan.higgsfield-capture`. Its installed plist is in `~/Library/LaunchAgents/`; a reviewable copy is in `scripts/capture/`. The daemon reads new source records every two seconds and publishes only prompts and final answers. It also runs after this chat finishes and after login.
- Raw message bodies are preserved. Only generated frontmatter counters/timestamps are refreshed as the session grows. Existing entry bodies must remain an exact prefix; conflicting history raises an error instead of being overwritten.
- Source extraction metadata lives in `docs/capture/provenance/`. Source JSONL files remain in the user's local Codex store and are not copied into the public repository because they contain excluded tool and reasoning traffic.
- Initial setup-source extraction and the two originally failed exec attempts are labeled in the report. Their actual on-disk text was extracted automatically; no historical prompt or answer was invented.
- Separate CLI specialist sessions launched with `codex exec` in this project are verified by capture-only canary `01a12d7a-fb56-7470-a463-9fbc5cab7353`. Each gets an explicit handoff file and exclusive output paths. Check the full prompt at launch and full final/source record on return; root alone commits. Do not use worktrees or alter the capture destination without a new canary.
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

The October 12 deployment audit found two automatic client suggestion sessions whose full transcripts are no longer discoverable. Their genuine native prompt/Stop journals still match their automatically produced logs exactly. Unmodified journal bytes are preserved under `provenance/*.native.jsonl`, with hashes and limits in `native-journal-continuation.json`. No raw log was edited. The verifier now checks both active and archived transcript locations and reports these two as journal-only (`source_text_exact_match: null`); it does not call them source-transcript matches. All coordinator and production-specialist sessions remain source-verifiable. `source_transcript_audit_complete: false` therefore discloses the two missing suggestion transcripts rather than preventing verification of the remaining sessions. Capture configuration and destinations were not changed.

## Final sprint client revalidation — 2026-10-12 19:45 UTC

The client updated to 0.162.0-alpha.17.2. Two new independent CLI canaries, without reinstalling, passed exact source prompt/final matching: `01a131a3-2d7d-7301-b9c1-27af58210e23` and `01a131a3-6a2d-7643-abbe-e3fef23f00e2`. Current Desktop session `01a131a2-4fea-7042-9693-f24fad48db8c` now emits native hooks too; its current prompt matches its source exactly, while its final remains future capture. The transcript parser was narrowly revalidated for the observed version. Its exporter defers sessions with native journals to that writer, preserving native timestamps and avoiding two writers per session. Eleven capture unit checks pass. No hook definitions or destinations changed. The existing LaunchAgent was restarted to load the change.

A third pre-existing client suggestion session, `01a1318d-065b-7672-bfe1-08d7b222acf1`, has exact native-journal proof but no discoverable full transcript. Its genuine journal is preserved byte-for-byte at `provenance/01a1318d-065b-7672-bfe1-08d7b222acf1.native.jsonl`. The sprint-start audit discloses all three journal-only sessions; it does not claim full-source completeness. Separate production CLI specialists retain full-source verification.
