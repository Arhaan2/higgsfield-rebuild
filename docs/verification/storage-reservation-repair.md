# Confirmed provider failure: storage reservation repair

Task `p4-failed-storage-repair-001`, Backend, 2026-10-12 UTC. Backend implementation and isolated checks are complete; root and independent reviewer acceptance remain pending. This report does not pass V3/P4 or claim live provider/deployment evidence. Actual spend: **$0**.

Authored paths: `src/server/jobs.ts`, `tests/server/failure-reservation.test.mjs`, this report. No changes to schema, triggers, migrations, contracts, dependencies, reviewer regression, capture configuration, or Git history were made by this task. Concurrent changes belonging to other owners were preserved.

## Capture

Before source edits, the complete task prompt was observed verbatim in `.agent-logs/2026-10-12_03-32-45_01a12e2b-7ab3-7392-812f-e525324cf861.md`, session `01a12e2b-7ab3-7392-812f-e525324cf861`, prompt timestamp `2026-10-12T03:32:45.169Z`, recorded model `gpt-6-astra`. The automatic log was read only. Final-response capture and exact-match verification necessarily follow emission and belong to root. No child workers were used.

## Before and after

Before editing, this command failed, exit 1:

```sh
node --import ./tests/server/register.mjs --test --test-name-pattern='P4-01' tests/server/creative-loop.test.mjs
```

The sixth request returned **429 `STORAGE_QUOTA`**, while the reviewer regression expected 202. Source inspection found that the `COMPLETED` + error branch marked the job failed and spend committed, without settling storage. The reviewer's preceding count of five held reservations/25 MB is documented separately in `phase-4.md`.

After the repair, that unchanged regression passes. An additional isolated reproduction directly queried SQLite after five confirmed mock failures:

| Measurement | Observed |
| --- | --- |
| Job history | 5 `failed`, all `accounting_state='committed'` |
| Counted monetary reserves | 50,000 micro-USD (mock accounting, not expenditure) |
| Storage reservations | 5 `released`, retaining their original 25,000,000-byte historical amounts |
| Held storage from those failures | 0 bytes |
| Assets / mock R2 objects | 0 / 0 |
| Sixth admission | HTTP 202, job `queued` |

## Implementation and boundaries

The confirmed-failure branch uses one D1 batch. Its first statement releases only a held reservation with the same job and guest; its second records the terminal failure, keeps monetary accounting committed, and clears the job lease. Both statements share identical job eligibility predicates: owner, job ID, matching unexpired lease, a pollable pre-output state, known provider request ID, and absent provider/output asset metadata. Releasing first keeps the lease guard available to both statements. [D1 documents batch rollback of the whole sequence on statement failure](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch); the isolated harness verifies rollback using an injected terminal-write failure.

Unknown POSTs without a provider ID and failed/unavailable status reads retain their holds. A transfer retry that has already observed completion keeps `transfer_failed` and its hold when a later provider response contradicts that observation. Retained output and job/project lineage paths are unchanged. Existing terminal history is not rewritten or swept: this fixes future confirmed-failure transitions, not historical reservations already leaked before the repair. No shared interface or migration change is requested.

## Verification

All runtime checks use in-memory SQLite, mocked provider fetch, mocked R2, and committed fixture bytes. None calls the real provider.

| Check | Actual result |
| --- | --- |
| `node --import ./tests/server/register.mjs --test tests/server/failure-reservation.test.mjs tests/server/creative-loop.test.mjs` | **14/14 pass**, exit 0 |
| `node --import ./tests/server/register.mjs --test tests/server/*.test.mjs` | **36/36 pass**, exit 0 |
| `./node_modules/.bin/tsc --noEmit --incremental false` | **Pass**, exit 0 on final run |
| `node node_modules/eslint/bin/eslint.js src/server/jobs.ts tests/server/failure-reservation.test.mjs` | **Pass**, exit 0 |
| Project-config TypeScript API check with `jobs.ts` as entry and its imports | **Pass**, zero diagnostics; no emitted files |

The 12 added tests establish reservation isolation across jobs/guests/uploads; unchanged failure identity, snapshot, revision, draft and replay; counted spend and budget refusal; unknown/unavailable holds; result-fetch and uncertain R2-write retry holds; contradictory status during transfer retry; stale failure at exact lease expiry and after queued/running/unknown/transfer-failed/succeeded successors; a successor still holding an active lease; and batch rollback/recovery. The existing creative-loop test additionally verifies prior results, cross-project reuse, ownership and downloads.

The first full TypeScript run failed because another owner's visual fixture lacked the concurrently introduced `sourceJobs` field at `tests/visual/fixture-studio.tsx:56`. Read-only reinspection found that owner had added it; the full command was rerun successfully. No fixture edit was made here. An exploratory direct-file `tsc` command also lacked the project's path-alias configuration; the project-config API check above replaced it and passed. Neither preliminary failure is represented as a passing run.

Read-only fingerprints at handoff: reviewer regression SHA-256 `00feaaf2be561f50e49cfeffcfc77a19ef87f1cdad599a17b7b7ff9a4d70ef91`; schema guards SHA-256 `c99266ebca45a7c4c24d848924c283c41919b6ec524615999ce82d17fa41585c`.

Next: root and independent reviewer inspect the three authored files, repeat the relevant checks, verify the final response's exact automatic capture, and update the coordinator-owned checkpoint. Hosted D1 behavior and live generation were not exercised. No deployment, commit, push, spending, or phase advancement occurred in this task.
