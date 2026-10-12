# Client repairs — p3-client-repairs-001

IR01, IR02 and IR03 repaired within the assigned client paths. API contracts, server admission, the 2,500-character save/submission limit, components, styles and configuration are unchanged by this task. Apple Design's agency and accurate-feedback guidance informs preservation of editable text and honest pending states.

- **IR01:** Recovery validates the existing draft structure with an unrestricted string prompt. It retains the exact editable text, including surrounding whitespace and currently invalid length. API validation remains separate.
- **IR02:** Rate limits, authentication/access failures, invalid responses, request-key conflicts and unknown errors retain the same pending project/key/revision. A returned Job must match its project and request key. Pending clears on that acknowledgement or the explicit admission errors `LIVE_DISABLED`, `BUDGET_ZERO`, `BUDGET_EXHAUSTED`, `REVISION_CONFLICT`, `INPUT_REQUIRED`; the current server emits these only after checking for an existing key. Keep this ordering if server admission changes. Retrying never manufactures a replacement request. Storage-failure wording describes only the current attempt, without claiming an earlier request was never sent.
- **IR03:** Copy/session replacement increments a context epoch, resets request bookkeeping, and invalidates old continuations. Refresh checks epoch and project identity before installing a Job, fetching project details, installing results, reporting errors, or clearing current busy state. The same boundary protects adjacent save/create, submit, upload, reference-fetch and fork/navigation continuations. Old promises cannot clear replacement operations' busy state.

## Actual checks

- `node src/client/checks/studio-state.mjs`: **27 passed**, retaining all 11 prior checks. Added invalid inactive/active prompt reload and unchanged API-limit assertions; lost acknowledgement → 429 → other inconclusive errors → reload → same-key/revision acknowledgement; delayed refresh/detail/error across conflict-copy and session replacement; late save/submit/upload successes/errors; replacement busy-indicator protection.
- Before production edits, the new primary regressions failed on the old modules. Rechecked the final primary regressions with original modules substituted **only in memory**, read through `git show HEAD:<path>` and SHA-256 matched to `docs/verification/integration-review.md`: all 11 prior checks and the conclusive-rejection check passed; IR01, IR02 and all six IR03 boundary cases failed as expected (exit 1). No working source or Git state was reverted.
- `npx tsc --noEmit`: **passed, exit 0** on the repaired source.

These are mocked-API/minimal-hook checks, not a React renderer, browser, deployed service, provider, or billing verification. No browser/network/provider request, install, infrastructure action, spending, Git mutation, deployment or delegation was performed. V3 remains pending; no phase gate advanced. No shared-interface or backend change is required for these repairs. Root owns integrated browser checks and final acceptance.

## Capture closure

Verified the full **2,933-character** assignment against `docs/agents/handoffs/12-client-repairs.txt`, verbatim exactly once in the automatic log:

- Session: `01a12dec-e271-79b2-8fac-144da7f16fa2`
- Recorded model: `gpt-6-astra`
- Destination: `.agent-logs/2026-10-12_02-24-23_01a12dec-e271-79b2-8fac-144da7f16fa2.md`

Raw logs/configuration were not edited. Root must verify the full final after emission. After this session stops, root can inspect and capture the remaining genuine response with these commands (not executed here):

```sh
cat .agent-logs/2026-10-12_02-24-23_01a12dec-e271-79b2-8fac-144da7f16fa2.md
PYTHONDONTWRITEBYTECODE=1 python3 scripts/capture/verify.py
git diff -- src/client/recovery.ts src/client/use-studio.ts src/client/checks/studio-state.mjs
git add src/client/recovery.ts src/client/use-studio.ts src/client/checks/studio-state.mjs src/client/repair-notes.md .agent-logs/2026-10-12_02-24-23_01a12dec-e271-79b2-8fac-144da7f16fa2.md
git diff --cached --stat
# After root verifies the full final, genuine provenance and intended staged set:
git commit -m "Repair client draft recovery and request continuation races"
git push
```
