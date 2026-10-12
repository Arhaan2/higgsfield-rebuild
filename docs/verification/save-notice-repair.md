# Save notice repair

Task `p3-save-notice-repair-002` · Frontend · Phase 3 · 2026-10-12 UTC.
Assigned repair complete; root owns integration, rendered recheck, phase checkpoint and V3 acceptance.

## Observation and change

Root reported the contradictory restored-buffer notice in `07-invalid-replacement-mobile.png`: a new shot had been restored, renamed, edited and given a valid JPG; `Draft saved` appeared alongside “It is not a confirmed server save.” This session did not operate a browser or independently inspect that rendering.

`use-studio.ts` now clears only the two specific unsaved-recovery notices after the save operation succeeds and the acknowledged project signature matches the **current active draft**. It uses a functional notice update so a storage, session or result notice that replaced the recovery notice remains intact. Existing context guards still discard replies from replaced sessions. Failed saves retain the recovery notice and error handling. No buffer replacement, recovery-schema, server-request, shared-interface or generation-authorization changes were made.

Clearing the obsolete notice leaves the existing save status as the acknowledgement. It does not claim the inactive task has been saved to the server; that draft remains in browser recovery. The installed `apple-design` skill was read at `/Users/arhaan/.codex/skills/apple-design/SKILL.md`; its §13 causality/utility and §16 status/completion/warning distinction guide this narrow feedback correction. Existing design and component contracts remain unchanged.

## Verification

- Before the application fix, the added behavioral tests reproduced the stale notice for the new-shot JPG flow and for both new/existing restored drafts after their subsequent save. The initial storage-failure simulation also exposed a harness Proxy assignment error; it was corrected to throw from the backing storage Map.
- `node src/client/checks/studio-state.mjs` — **pass, exit 0, 32 checks**. New coverage: SN01 restores a new buffer, changes title/prompt, uploads a mocked valid JPG and confirms saved state plus cleared notice and retained inactive recovery; SN02 defers saves on both new/existing shots, edits title/prompt meanwhile, confirms unsaved status and retained recovery notice, then confirms a subsequent save clears it; SN03/SN04 preserve storage/result notices arriving during a save. Existing conflict, session replacement, inactive-buffer reload and generation-request identity checks also pass.
- `./node_modules/.bin/tsc --noEmit --incremental false` — **pass, exit 0**, no diagnostics. Incremental writes disabled to respect exclusive file ownership.
- The harness executes the actual hook/recovery code with mocked APIs and in-memory storage. It is not a React renderer, browser check, real JPG upload or proof of deployed persistence. No network, provider, spending, dependencies, commits or deployment actions occurred.

Verified source SHA-256:

| File | SHA-256 |
| --- | --- |
| `src/client/use-studio.ts` | `b96129b6c2607b16883276372cf24f008d69d9d89f6ac4588984a5048a9b0243` |
| `src/client/checks/studio-state.mjs` | `dc1b8ade051de517da54c991dffb4389f9b70076dead358a43d1d30b1ec61829` |

## Capture and handoff

Original CWD: `/Users/arhaan/Desktop/higgsfield-rebuild`. Session `01a12e0f-6844-7260-8143-af4782cf1eea`; automatic log metadata reports model `gpt-6-astra`. Destination: `.agent-logs/2026-10-12_03-02-05_01a12e0f-6844-7260-8143-af4782cf1eea.md`. Read-only exact-text comparison confirmed the full assigned prompt from `docs/agents/handoffs/15-save-notice-repair.txt` exists in that log. Raw logs were not authored or changed by this worker. Final-response capture cannot be verified before emission; root must verify it afterward.

Changed paths are this report, `src/client/use-studio.ts` and `src/client/checks/studio-state.mjs` only. No implementation blocker remains. Root must perform the rendered recheck and integrate; V3 and final raw-response coverage remain unverified here. No phase gate is advanced by this report.
