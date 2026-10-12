# Phase 4 independent connected-journey review

Task `p4-connected-review-001`, Reviewer, 2026-10-12 UTC. Reviewed source revision **`36cd60b88263fbf8fe12615c81a2a9eaaf1174fb`**. Product source was unchanged during review; this report and `tests/server/creative-loop.test.mjs` are the only reviewer edits. Root's existing capture/assignment changes were left alone.

**P4 is not passed.** V3 and real connected generation remain `not_run`. C0/D2 and the explicit R1 exception are supplied gates, not newly established research evidence. All generation exercised here uses isolated mock fetch/R2 and in-memory SQLite; actual spend is $0. No browser, local HTTP server, deployed application, live inference endpoint, Git mutation, or worker delegation was operated. Public documentation was read only. Root owns browser continuity and deployment verification.

## Findings, highest impact first

### P4-01 — blocking for enabled failure recovery: terminal failures exhaust storage with no output

- **Source:** `src/server/jobs.ts:135–137` commits the confirmed failed job but does not release its output storage reservation. `src/server/schema-guards.sql:33–36` reserves 5,000,000 bytes per image request; `:14–15` counts held bytes toward the 25,000,000-byte guest ceiling. Compare the explicit release for a never-submitted job at `src/server/jobs.ts:76–80`.
- **Smallest demonstrated reproduction:** in the isolated harness with mock admission enabled and an ample fake cap, submit five image jobs sequentially; return `COMPLETED` with an error for each status read, with no result/transfer. Attempt a sixth image job. Run `node --import ./tests/server/register.mjs --test --test-name-pattern='P4-01' tests/server/creative-loop.test.mjs`.
- **Expected:** retain all failed snapshots and conservative spend accounting, but release storage that cannot contain an output so an explicit retry can proceed within remaining quotas.
- **Actual:** five failed jobs, zero assets, five held reservations totaling 25,000,000 bytes, only 50,000 micro-USD counted; sixth job returns **429 `STORAGE_QUOTA`**, rather than 202. There is no user recovery route to free those reservations. The added assertion fails at `tests/server/creative-loop.test.mjs:128`. This is a mock-controlled reproduction, not an observed provider failure.
- **Affected acceptance:** “Failed jobs retain the draft and provide a useful recovery action”; truthful failure/usage-limit states; server-side usage limits. Current zero-budget operation prevents reaching this branch, but enabling real generation would expose it.
- **Smallest proposed repair, not applied:** backend owner should atomically release the held output reservation only when the same leased job transitions to confirmed `failed` without an output. Preserve the failed job and committed spending allowance. Do not release reservations for unknown submissions or transfer failures. Existing schema permits held → released; no shared-interface or quota expansion is requested. Re-run the failing regression and existing unknown/transfer tests after repair.

### P4-02 — important: cross-project reuse loses inspectable provenance and mislabels a generated image

- **Source:** `src/server/api.ts:80–82` correctly returns only the target project's assets/jobs. `src/client/use-studio.ts:209–215` retrieves an external start asset but not its source job or arbitrary parent. `components/studio/StudioView.tsx:28–38,42–46` resolves source jobs only from that project's job list. `components/studio/AssetDetails.tsx:29–31` consequently renders missing prompt/model and an upload-specific fallback.
- **Reproduction:** retain generated image A in project A; use A as a start frame and parent in project B (a conflict “Save my edits as a separate shot” can create this relationship). Complete B's mocked video; inspect its parent A, then open Details. B's detail response has B's job; fetching A supplies `sourceJobId` but does not fetch A's original job. The added connected-loop test establishes the permitted cross-project relationship and confirms that A's original job still exists.
- **Expected:** the parent's recorded immutable prompt/model remain inspectable, or an honest temporary metadata-unavailable state leads to the source project. A generated image must not be described as uploaded. Parent assets that are not the active reference should also be resolvable.
- **Actual source/static-render evidence:** rendering the real `AssetDetails` with the generated parent and no locally resolved job produces both **“Live generation”** and **“Not recorded — this is an uploaded image.”**, with model **“Not recorded”**. The source job remains retrievable through the existing owner-protected `GET /api/jobs/:id`. Arbitrary external parents instead remain “preview is unavailable here.” No browser reproduction was performed.
- **Affected acceptance:** reuse restores relevant settings; results retain truthful metadata; inspectable input/version relationships. Server data is preserved; presentation and original-prompt reuse are disconnected.
- **Smallest proposed repair, not applied:** frontend owner should resolve parent assets and source jobs on demand with existing asset/job read endpoints, maintain them separately from the current project's version/poll list, and use source-aware fallback copy. `src/client/api.ts` currently lacks a job-read wrapper. No public type/model change is needed; root assigns that client change and verifies the real browser parent/reuse path.

### P4-03 — important: Library silently hides failed project-detail reads

- **Source:** `components/studio/LibraryView.tsx:18–25` discards rejected `Promise.allSettled` results; `:29,38–41` clears loading without exposing a detail failure or retry action.
- **Smallest reproduction:** return a successful project list containing a saved shot, then reject that shot's detail request with 503. The inline mock hook/static React rendering probe executed the actual component under precisely that condition.
- **Expected:** retain the project link and distinguish unavailable preview/request status from an empty draft, with a retry action.
- **Actual:** the saved shot card remains, loading ends, but no error, retry, or latest-request status appears. Probe output: `retainedProjectVisible=true`, `loadingVisible=false`, `errorVisible=false`, `retryVisible=false`, `latestRequestVisible=false`. A pending or failed job can become invisible on this Library visit; its server record is not lost.
- **Affected acceptance:** pending/failure states are truthful; retained Library work remains inspectable; useful failure recovery.
- **Smallest proposed repair, not applied:** inspect settled detail results and expose per-shot failure/retry, preserving already loaded cards. Do not silently treat missing detail as absence of versions. Root owns browser verification.

No separate cosmetic finding is asserted. The priority is recovery and provenance, not a visual redesign.

## Coverage and actual checks

| Check | Result | Evidence and boundary |
| --- | --- | --- |
| Existing server protections | pass | Original 22 server tests passed. Ownership, request-key replay, zero-budget denial, bounded validation, immutable assets, unknown submissions, transfer reconciliation and private byte ranges are mock-controlled checks. |
| Existing client recovery | pass | `node src/client/checks/studio-state.mjs`: 32 checks passed. Mock hook-state harness, not browser/React lifecycle verification. |
| New connected server regression | pass | `creative-loop.test.mjs:28`: all three preset drafts accepted unchanged; mocked image → cross-project video → revised draft → reread → correct downloads. Only two mocked submit calls; draft reuse does not generate. |
| Original jobs and real byte metadata | pass | New test preserves both immutable job DTOs after revision, original asset ownership, start-frame ID/hash and parent ID. Requested 1280×720 remains in snapshot while retained fixture dimensions correctly read 1600×2397 despite contradictory mocked metadata. Seed 123 remains separate result metadata. Video duration stays null rather than claiming requested five seconds was measured. |
| Confirmed-failure recovery | fail | P4-01 regression: 429 `STORAGE_QUOTA`, expected 202, after five no-output failures. |
| Current complete server suite | fail | `node --import ./tests/server/register.mjs --test tests/server/*.test.mjs`: **24 tests, 23 pass, 1 fail**, exit 1. The sole failure is the intentional, unskipped P4-01 regression. |
| New test lint | pass | `node node_modules/eslint/bin/eslint.js tests/server/creative-loop.test.mjs`, exit 0. |
| Cross-project metadata UI | fail | P4-02 source trace plus actual component static rendering. Browser reproduction `not_run`. |
| Library partial failure UI | fail | P4-03 actual component under mock hooks plus static rendering. Browser reproduction `not_run`. |
| Retained downloads and visitor isolation | pass | New mocked API test hashes image/video download bytes, checks attachment responses, and rejects the second guest's media/download requests with 404. Does not prove browser playback or hosted R2. |
| New local HTTP/browser evidence | not_run | Explicit browser ownership constraint honored; no server or real HTTP tests run in this review. |
| Deployed connected path / real model compatibility | not_run | V3 unmet, live generation disabled and budget $0; no public integrated-flow claim. |

Preset mapping is exactly the accepted three: `dune-light` → text-to-image, `slow-reveal` and `desert-drift` → image-to-video with `sample-dune-light` as start frame. Explore URLs at `app/page.tsx:13`, initialization at `src/client/use-studio.ts:176–188`, and server operation validation at `src/server/store.ts:49–54` agree. This is source inspection plus server draft validation, not a clicked Explore flow. Prompt editing remains prose direction; no invented camera control exists.

Sample provenance remains explicit: `src/catalog/samples.ts:5–15` and `docs/design/sample-provenance.md` identify independent Unsplash still/Pexels clip, no source jobs, prepared previews and authored suggested prompts. Explore (`app/page.tsx:14`), Studio (`StudioView.tsx:81`) and Details (`AssetDetails.tsx:26–30`) distinguish them from generated output. The real licensed files are used **only as fixture bytes** by the new mock test; it does not claim they were generated or form a real pair. Attribution source/license records were inspected, not independently re-adjudicated.

Reference semantics agree in UI, capabilities, immutable snapshots and payload: one retained JPEG/PNG start frame is sent through `image_url`; no character-reference role or tail image is substituted. App bounds are 5 MB, 256–4096 pixels per side and 16 MP (`src/server/images.ts:3–4`, `use-studio.ts:222–232`). No crop/conversion or provider-specific aspect validation exists. The current [official Kling schema](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/api) documents `image_url`, optional tail image and five/ten-second requests, but provides no numeric aspect constraint in the retrieved input schema. Therefore no unsupported numerical rule is invented: actual decoder/aspect compatibility, including generated-image handoff, remains **not_run** and must be verified before claiming the real flow works.

Prior real local evidence is **documentary only in this review**: `phase3-continuation.md` records root's local upload/reload and ordinary-click sample/private download hashes. It predates this review and is not new evidence for generated image/video reuse. Its source is identified as `fa28ec4…` before the accompanying repair; current public deployment identity was not rechecked. Per `docs/STATUS.md`, the last reported public app was the version-1 sample shell, not this integrated revision.

## Capture, ownership and next dependency

Before substantive review, the automatic log contained the complete actual task prompt. A read-only comparison also found the full `docs/agents/handoffs/16-phase4-review.txt` prompt contiguously in the log:

- Session: `01a12e24-072e-7e91-a4a1-9989a8a74bdc`; recorded model `gpt-6-astra`.
- Destination: `.agent-logs/2026-10-12_03-24-37_01a12e24-072e-7e91-a4a1-9989a8a74bdc.md` in the original CWD.
- Prompt capture: verified. Final response: **not emitted/captured at review time**; coordinator must verify the exact final after Stop. Full-session closure remains unresolved. No raw log was edited.

Read and applied installed Apple Design guidance on agency, honest feedback and control/content relationships. Cloudflare/Workers skills informed the bounded server review; [current Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) were consulted. Binding types were read from installed `@cloudflare/workers-types` 4.20260515.1 as the local fallback; this was not a new full deployment/config audit.

Root should assign the P4-01 backend repair and P4-02/P4-03 frontend repairs, then rerun the affected checks and own the connected browser review. No shared schema, model, preset count or spending change is requested. Hosting/R2 availability and authorized real generation remain separate external dependencies; this reviewer neither advances V3/P4 nor requests a paid allowance. Coordinator alone owns status updates, commits/pushes and final capture closure.
