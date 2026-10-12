# P4 provenance and Library repair

Task `p4-provenance-library-repair-001`, Frontend, 2026-10-12 UTC. Assigned implementation complete; integrated P4 acceptance and real V3 remain pending. Supplied gates: C0 verified, D2 accepted, explicit R1 exception. Spend: $0. No browser, provider, worker, Git, install, deployment, capture modification, or backend change.

## Implemented and checked

- `src/client/api.ts`: `api.job(id)` reads the existing owner-protected `GET /api/jobs/:id`, with the shared same-origin/no-store request behavior.
- `src/client/use-studio.ts`: resolves both drafts' start/parent references and immutable job snapshot references, including external parents unrelated to the active start frame. Reads each retained asset's original source job into **`sourceJobs: Job[]`**, separately from current-project `jobs`. Snapshot DTOs are retained without reconstruction; matching job ID and asset project are checked. External jobs never enter current-shot polling, active-job admission checks, or the job version list. A manual refresh is also guarded by project identity. Current-shot refresh retains supplemental assets. Metadata lookup does not change selected assets or editor drafts.
- Metadata requests are attempted once per ID/context to bound cyclic provenance and failure loops. A reload/remount or new context can retry unavailable metadata; this patch adds no dedicated metadata retry control. Ordinary failures retain available data. Context replacement, unmount and known session expiry reject stale successes/errors; expiry clears private assets/jobs and supplemental metadata while preserving text. Source jobs are read-only snapshots, not independently refreshed status records.
- `components/studio/LibraryView.tsx`: examines every project-detail settlement. Failed cards retain their Studio links and show **“Preview and request status unavailable”**. A native **Retry previews** button outside the card anchors requests only failed details, reports retry progress and preserves other cards. Missing detail no longer implies zero versions. Known guest expiry immediately clears private cards, previews, failures and recovery state, including when another detail request is pending. Epoch guards reject stale responses and unmounted updates.
- Applied installed `/Users/arhaan/.codex/skills/apple-design/SKILL.md`: honest status/error feedback, direct action labels, retained agency through working shot links and retry, and the existing design system. No style ownership changes or animation additions.

## Verification actually run

| Command | Result |
| --- | --- |
| `node src/client/checks/studio-state.mjs` | **44 passed**: all original 32 plus 12 P4 checks. |
| `node src/client/checks/library-state.mjs` | **6 passed**. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Exit 0. No incremental artifact written. |
| `node node_modules/eslint/bin/eslint.js src/client/use-studio.ts src/client/api.ts components/studio/LibraryView.tsx src/client/checks/studio-state.mjs src/client/checks/library-state.mjs` | Exit 0; no errors, two existing `@next/next/no-img-element` warnings in Library. |

Studio checks exercise recursive/cyclic external provenance, original prompt/model, arbitrary snapshot parents, no foreign-job polling/admission contamination, API GET construction, wrong job/project rejection, failed metadata retention, expiry followed by late success, stale asset/job success/401 after session replacement, same-owner copy replacement, and current-result refresh retaining external metadata and edited text. Existing draft/pending/recovery checks remain passing.

Library checks exercise mixed 200/503 detail responses, actual component JSX-tree text and links, native retry outside anchors, targeted retry success/failure, immediate expiry despite a pending sibling response, stale retry expiry after a newer load, list expiry and unmount. Tests use mock APIs and mock hook state/JSX trees; **they do not prove React lifecycle behavior, browser rendering, keyboard interaction, playback, downloads or live inference**. The existing backend creative-loop test was read, not modified or rerun; its mock evidence is separate from these client checks.

## Exact minimum integration requested from root

After the current component owner finishes, update only metadata lookups in `components/studio/StudioView.tsx`:

```diff
 const allAssets = [...SAMPLE_ASSETS, ...studio.assets];
+const metadataJobs = [...studio.jobs, ...studio.sourceJobs];
 const selected = allAssets.find(asset => asset.id === studio.selectedId);
-const job = selectedJobId ? studio.jobs.find(item => item.id === selectedJobId) : studio.jobs.find(item => item.id === selected?.sourceJobId);
+const job = selectedJobId ? studio.jobs.find(item => item.id === selectedJobId) : metadataJobs.find(item => item.id === selected?.sourceJobId);
```

Inside `reuseAsset`:

```diff
-const sourceJob = studio.jobs.find(item => item.id === asset.sourceJobId);
+const sourceJob = metadataJobs.find(item => item.id === asset.sourceJobId);
```

The existing `job` prop passed to `AssetDetails` and `parent` lookup then receive resolved immutable provenance. Keep all status notices, admission checks and version enumeration on **`studio.jobs`**. Do not merge `sourceJobs` into that array. No backend or shared-contract change is needed.

Root also owns truthful unavailable-metadata copy and actions in `StudioView`/`AssetDetails`: a generated asset with no resolved job must not get the upload-specific “Not recorded” fallback or an unrelated suggested prompt presented as its original. Suggested wording: “Original prompt temporarily unavailable. Open the source shot to inspect it.” Where `asset.projectId` exists, link to `/studio?project=${asset.projectId}`. Distinguish “Model temporarily unavailable” from an upload without a generation model. Guard original-prompt reuse while its job is unavailable; keep the separately owned start-frame action meaningful. These view changes were **not applied** here.

Root must verify rendered success/loading/failure provenance, original-prompt reuse, partial Library failure/retry and accessible interaction after integration. No full P4 pass is claimed.

## Capture and ownership

Full actual task prompt was present in the automatic destination **before source edits**:

- Session: `01a12e2c-91a6-7412-b4f3-1dcf52ead026`.
- Log: `.agent-logs/2026-10-12_03-33-56_01a12e2c-91a6-7412-b4f3-1dcf52ead026.md`.
- Recorded model: `gpt-6-astra`; prompt timestamp `2026-10-12T03:33:56.570Z`.
- Prompt capture verified by reading the complete log entry. Final response has not yet been emitted; root must verify its exact automatic capture after this session stops. No log was edited.

Only the six assigned writable paths were changed: the API, hook, Studio check, Library view, new Library check, and this report. `StudioView.tsx`, `AssetDetails.tsx`, styles, reference-action helper/check, contracts, configuration and root phase status remain with their owners. Root's next action is the integration above, rendered verification and capture closure.
