# Integration review — p3-integration-review-001

Reviewed 2026-10-12, 02:14–02:21 UTC. Accountable coordinator: root. **Three actionable, code-confirmed findings; repairs required before integration acceptance.** IR02/IR03 affect generation when subsequently authorized; no finding demonstrates a bypass of the current zero-spend policy. Root alone accepts, releases, or deploys. V3 remains pending.

## Findings

### IR01 — P1 / important: an overlong editor draft destroys recovery on reload

- **Location:** `src/client/recovery.ts:20`; related `src/contracts/studio.ts:71`, `src/client/use-studio.ts:132–163`, `components/studio/StudioView.tsx:64`.
- **Trigger:** In an existing shot, enter 2,501 characters in Create image, switch to Animate image, enter a valid motion prompt, save, then reload. The textarea allows the over-limit input. The active motion draft is saved, so the departure guard does not warn about the other task.
- **Observed:** The browser record contains all 2,501 characters before reload. `readRecovery` validates both editor buffers with the API submission/save schema, rejects the entire record, and initialization replaces it. The restored image prompt is empty. The valid saved motion prompt survives. This is silent loss of the other task's text despite “Switch tasks without losing your text.” Invalid active drafts likewise lose their browser recovery.
- **Evidence:** Focused execution using the existing hook harness and unchanged production modules, with only mocked API responses: `beforeLength=2501`, `persistedBeforeReload=true`, `activeDraftSaved=true`, `afterLength=0`, `activeAfter="new valid video draft"`.
- **Minimal repair:** Use a recovery-specific structural schema that preserves editable, currently invalid prompt text. Keep the 2,500-character limit at save/submission validation. Do not discard both task buffers because one cannot yet be saved. Add a reload regression covering an over-limit inactive draft and a valid saved active draft.

### IR02 — P1 / important, before live enablement: rate-limited replay forgets an uncertain submission

- **Location:** `src/client/use-studio.ts:284`; related `src/server/api.ts:72–73`, `src/server/jobs.ts:33–34`.
- **Trigger:** A job POST is accepted but its browser response is lost. While the original tab retains its pending key, another tab can reconcile the original job to success. The guest exhausts the shared 60/hour write limit. “Check original request” then receives `429 RATE_LIMITED` **before** the server looks up the existing key.
- **Observed:** The client clears the pending key on that 429, hides the unresolved-submission state, and a later Generate click makes a new key for the same revision. Once the rate window resets and the original job has succeeded, the active-job guard allows another generation. The 429 says nothing about whether the earlier attempt was accepted.
- **Evidence:** Existing hook harness: first request loses acknowledgement; second uses the same key and returns 429; pending becomes null; third uses a different key with the same revision. Separate existing SQLite/backend harness: original job reaches `succeeded`; a fixture sets the write bucket to 60; replay returns `429 RATE_LIMITED`; after advancing the isolated clock one hour, a new key returns 202 and the mocked provider POST count becomes 2. All provider/storage calls were injected mocks; no real charge or deployed duplicate is claimed.
- **Minimal repair:** Preserve an already-ambiguous key/revision across rate limits and other responses that do not establish the original outcome. Clear it only after obtaining the original Job or a conclusive non-admission result. Consider allowing validated existing-key replay before new-write rate admission, while retaining an appropriate read/replay limit. Add the lost-ack → rate-limit → retry regression; never replace its key automatically.

### IR03 — P2 / important: a late refresh inserts the old shot's results into a new copy

- **Location:** `src/client/use-studio.ts:243–248`; related `src/client/use-studio.ts:222–236`.
- **Trigger:** Start a job refresh; while it is outstanding, encounter a revision conflict and choose “Save my edits as a separate shot.” Let the old refresh return `succeeded` after the copy has been created.
- **Observed:** `saveSeparate` correctly installs the new project and clears assets/jobs, but the old callback unconditionally fetches its original project, then replaces the current assets/jobs and selected output. The new shot displays the old shot's versions as its own and announces a ready result. This is a same-owner result-association defect, not proven cross-visitor exposure.
- **Evidence:** Deferred-response execution with the existing hook harness returned `newProjectRetained=true`, `oldProjectJobInjected=true`, `oldProjectAssetInjected=true`, `oldAssetSelected=true`. No browser/provider calls.
- **Minimal repair:** Capture a project/session epoch for refresh operations; invalidate it on copy/session reset and ignore every stale continuation, including the project-detail fetch. Check the active project identity before installing results. Add a delayed-refresh/conflict-copy regression and apply the same guard to session replacement.

## Inspection and verification bounds

Read the full server implementation (`api`, `http`, `store`, `jobs`, `fal`, `uploads`, `images`, `media`, `transfer`, SQL guards), client API/recovery/hook, both server test files and their harness/loader, client check harness, Drizzle schema and complete initial migration. Also read shared studio types/schemas, sample catalog, server config, API route, DB helper, package manifest, TypeScript/Vite/Next/Drizzle configuration, hosting binding names, environment example, Worker entry point, all five Studio components, API/technical/component contracts, role/team/status/assignment documents, and implementation notes. Root's concurrent StudioView markup edits were not treated as a frozen visual build.

Applied the installed Apple Design skill's preservation of user agency and accurate feedback to these state transitions. Read the installed Cloudflare/Workers review guidance; this bounded local review makes no new platform-API compatibility claim and fetched/installed nothing.

- Exact-text comparison: all **10** required `CREATE TRIGGER … END;` bodies from `src/server/schema-guards.sql` occur unchanged in `drizzle/0000_cute_daredevil.sql`; the migration has exactly 10 triggers and 7 tables. It contains **no INSERT/UPDATE of budget_policy**; its cap defaults to zero. No migration was executed by this reviewer.
- Inspected owner predicates before private metadata/media access, reference ownership and image kind, conditional draft revision updates, immutable snapshot/asset guards, storage reservation accounting, guest-scoped request-key replay, submit/poll lease guards, bounded uploads, output URL restrictions, and deterministic transfer recovery. No additional actionable cross-owner exposure, zero-spend bypass, or automatic provider resubmission was found within these paths. This is not an exhaustive security certification.
- Four focused, in-memory probes reproduced the three findings: two client probes for IR01/IR02, one backend probe for IR02, one client probe for IR03. Probes reused the existing harness code without altering files; backend storage was isolated SQLite with mocked R2/fetch. They verify these code behaviors, not a real React renderer, browser, D1/R2 deployment, or provider.
- Read root's `docs/verification/local-http-integration.json`: 11 recorded real **local** HTTP checks pass. The reported 22 server / 11 client baseline checks were inspected, not rerun or claimed as independently executed here. Root's artifact identifies a dirty working tree at shell HEAD `6d5a576`; it does not pin all implementation bytes. Hashes below bind this review instead.
- **Still required:** regressions after repairs; root's integrated browser checks for save/reload, upload/reuse, conflict/copy, expiry, playback/seek/download; deployed guest isolation and real D1/R2 behavior on the released revision; actual authorized generated-media compatibility/playback and billing evidence for V3. Current public flags/key absence were supplied by root, not independently queried. R1 advances only by the existing user exception. No reviewer waiver is issued.

## Reviewed SHA-256 evidence

Critical source hashes were taken twice, unchanged, before this report; the StudioView hash is a point-in-time supporting reference only.

| File | SHA-256 |
| --- | --- |
| `src/client/use-studio.ts` | `dfa0bc44613476d58b0ec8637592b98b832c9b6a548f50f8cec5ba37b0ea0b19` |
| `src/client/recovery.ts` | `25f8819e1799ebeb2e84664d4312a12910325039dec2ddca7c975d256a19a31b` |
| `src/server/api.ts` | `b3be27b2ce1b98feb75545a264ca889fe43634a297e2da08898063735a3c2ce8` |
| `src/server/jobs.ts` | `a508639e8749c0af67868eefbbde2beef63edec8a0e257532dbbc7fa53ab483d` |
| `src/server/schema-guards.sql` | `c99266ebca45a7c4c24d848924c283c41919b6ec524615999ce82d17fa41585c` |
| `db/schema.ts` | `036ea4e5fe63b55dcba9e4716433942aeeb1642d0d24de336c08c5947db7243b` |
| `drizzle/0000_cute_daredevil.sql` | `21d4a37e67febeca325da37fe71f8f74530c568b06f0ca3c68a51115b6e01dd3` |
| `src/config/server.ts` | `ba934105655471a718df9b8c2fa65e09d3c299a4b033adec6ec3fe71a9a77197` |
| `src/contracts/studio.ts` | `d88a33a1beee1a5bf642db0392fb171f69dc49b9ce73ee8f2026581f7e2b5b33` |
| `components/studio/StudioView.tsx` | `fa852ccc6b77e85a4f48c4a900ec0cbaac2ea756bf8dc6478c858446fe2b9d25` |
| `src/client/checks/studio-state.mjs` | `0c9b8b9023ff16e7943cdd5746a71bc1186980bf233bb21fdbd89dfba2f27684` |
| `tests/server/harness.mjs` | `eae233c4fefd1a7bb1c86b3fd67a59767fc82c17be0ff9a4a6978e3d8914ff19` |

## Capture and ownership

Actual session: `01a12de3-552d-7d80-8068-1d84d8965257`; recorded model: `gpt-6-astra`. Actual automatic destination: `.agent-logs/2026-10-12_02-13-56_01a12de3-552d-7d80-8068-1d84d8965257.md`. The complete 2,770-character task prompt matches `docs/agents/handoffs/10-integration-review.txt` exactly once in that log. The final response is not yet emitted and must be verified by root afterwards.

Only this report was authored. No application/test/config/dependency/raw-log/Git changes, installs, browser actions, live provider requests, infrastructure operations, migration application, delegation, or worktrees. Root owns repairs, regression tests, release decisions, and capture closure.

After this reviewer stops, root should inspect the appended final and verify capture before any commit/push:

```sh
cat .agent-logs/2026-10-12_02-13-56_01a12de3-552d-7d80-8068-1d84d8965257.md
PYTHONDONTWRITEBYTECODE=1 python3 scripts/capture/verify.py
git diff -- docs/verification/integration-review.md .agent-logs/2026-10-12_02-13-56_01a12de3-552d-7d80-8068-1d84d8965257.md
git add docs/verification/integration-review.md .agent-logs/2026-10-12_02-13-56_01a12de3-552d-7d80-8068-1d84d8965257.md
git diff --cached --stat
# After root checks that the staged set is intentional:
git commit -m "Record independent integration review and captured handoff"
git push
```

Include any genuine automatically generated provenance required by the capture verifier; never reconstruct or edit raw exchanges. These commands were not run by this reviewer.
