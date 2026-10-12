# Studio selection and preferred-version repair

Task `submission-studio-selection-001`, Frontend, 2026-10-12 UTC. Local implementation and controlled checks completed within the assigned original workspace. This report supplements the historical reviews; it does not change their release conclusions. R1 is the supplied user-authorized exception; R2 and the real generation allowance remain unchanged/disabled/zero. No browser, provider, deployment, Git mutation, child agent, dependency, configuration, backend or schema operation was performed by this specialist.

## Actual capture

Before substantive work, read the automatic session log and compared its complete assignment text with `docs/agents/handoffs/24-studio-selection.txt` after trimming surrounding whitespace: **the entire assignment was present verbatim**.

- Session: `01a12e63-f58e-7361-8c22-078723c01b78`
- Log: `.agent-logs/2026-10-12_04-34-26_01a12e63-f58e-7361-8c22-078723c01b78.md`
- Recorded model: `gpt-6-astra`; first prompt `2026-10-12T04:34:26.565Z`.
- Raw capture was read-only. Final-response coverage remains unresolved until root compares the automatically captured final after Stop with the actual final.

Read `AGENTS.md`, `docs/agents/TEAM.md`, `docs/agents/FRONTEND.md`, the installed `/Users/arhaan/.codex/skills/apple-design/SKILL.md`, assigned client/server contracts and `docs/verification/phase56-followup.md`. Applied specific labels, agency, immediate status, explicit completion/error feedback and existing visual hierarchy/styles. No new motion or style system was introduced.

## Reproduced before repair

1. Extended the actual Studio component/hook mock harness to select old generated job `job-frame-a`, then upload a controlled `new-reference`. After correcting the harness's missing upload capability field, the test reached the product behavior and failed: `studio.selectedId` was `new-reference`, but the stage's `AssetMedia` still received `frame-a`. Assertion: `successful upload must replace old selected job on stage`; actual `frame-a`, expected `new-reference`. The component's local `selectedJobId` overrode the hook's new asset selection.
2. A new explicit-preference hook regression failed with `explicit durable preference action must exist`: actual `typeof preferAsset` was `undefined`. Source inspection confirmed version inspection only changed local `selectedId`; no preference PATCH action existed. Inspection alone intentionally remains local in the repair.

These are controlled tests of actual source with mock React hooks/API, not browser captures or real generated-media evidence.

## Repair and contracts

`src/client/use-studio.ts` adds explicit `preferAsset(assetId)`. It accepts retained non-sample assets belonging to the current project and sends **only** `{ expectedRevision, preferredAssetId }` through the existing PATCH API. Inspection, including prepared-sample inspection, creates no guest/project/preference write. Existing server ownership validation and revision SQL remain untouched.

Preference writes wait for an already-running draft save; later draft saves wait for preference completion and then take the newest buffer snapshot/revision. Acknowledgement must match project, asset and the next revision. Updating the confirmed project/recovery revision never replaces the editable buffer, including inactive or invalid drafts. The existing expiry/conflict recovery paths remain authoritative. Network/invalid-response errors report an unconfirmed preference, retain drafts, and allow explicit retry. Context tokens reject old success/error responses after a copy or session replacement. Navigation waits for an active preference request; unload protection includes it. Originals and immutable job snapshots are unchanged.

`components/studio/StudioView.tsx` adds “Make preferred version”, “Saving preference…”, “Preferred version”, and targeted “Retry preferred version” feedback near the inspected asset. Help explains that preference controls Studio/Library opening and draft edits save separately. Confirmation/error messages name the attempted asset, so inspecting something else while waiting does not misidentify what was saved. Samples and foreign-project assets do not expose this action. Conflict/expiry cannot misleadingly offer an enabled retry.

The hook's selected asset now controls displayed media. Component-local job selection is used only when there is no selected retained asset. Job cards select output only when the job succeeded and the asset is among its recorded outputs. Successful reference upload therefore replaces the inspected old job; pending/failed upload retains the previous selection. Pending/failed/transfer-failed job selection displays request information without presenting fake output.

**Hook return additions for root integration:**

```ts
preferring: boolean;
preferenceError: string;
preferenceNotice: string;
preferAsset: (assetId: string) => Promise<void>;
```

No other public/shared contract changed. Root's `tests/visual/fixture-studio.tsx` initially failed TypeScript because those four fields were missing. Root subsequently added the fields (observed read-only); the specialist did not edit that file. Its inert fixture defaults are `preferring: false`, empty strings for both messages, and an async blocked action. The fixture remains simulated and is not preference persistence evidence.

## Verification

| Actual command/check | Result | Boundary |
| --- | --- | --- |
| `node src/client/checks/studio-state.mjs` | 58 passing | 44 existing + 14 new controlled hook cases. Preference-only payload, revision sequencing in both save orders, pending/newer typing, inactive invalid text, dirty and clean reloads, retry, conflict, expiry, stale copy/session responses, missing/foreign/sample rejection, invalid acknowledgements and navigation waiting. |
| `node src/client/checks/reference-action.mjs` | 29 passing | 18 existing + 11 new actual component/hook checks. Old-job upload reproduction repaired; success/failure across succeeded, queued, failed and transfer-failed jobs; output absent while a request lacks successful retained output; explicit preference feedback/retry; immutable originals. |
| Studio → Library controlled integration in reference-action checks | pass | Click actual preference button, hold/release PATCH acknowledgement, retain later typing, then mount the actual current Library component against the same mocked server state. Library's real shot card displays `/frame-b`, the saved preference; inspection plus preference causes exactly one PATCH. No Library source/check file was edited. |
| `node_modules/.bin/tsc --noEmit --incremental false` | pass after root fixture integration | Initial missing-hook-fields failure reported to root; subsequent full TypeScript check passed. No generated files/incremental cache. |
| `node_modules/.bin/eslint src/client/use-studio.ts components/studio/StudioView.tsx` | pass, 0 errors | Four existing `<img>` optimization warnings on reference/version/sample media. No lint suppression or image/provider configuration changes. |
| Browser, deployed persistence, backend integration rerun, live generation | not run | Browser/deployment belong to root; no network/provider/billing requests, no new synthetic generated output. Existing backend preference ownership/revision handling inspected, not reimplemented. |

## Files and next action

Authored only:

- `src/client/use-studio.ts`
- `components/studio/StudioView.tsx`
- `src/client/checks/studio-state.mjs`
- `src/client/checks/reference-action.mjs`
- `docs/verification/submission-studio-selection.md`

Root should inspect the final diff, verify the deployed/browser interaction and layout at its chosen widths, update the project checkpoint, and perform integration/commits/deployment. This local result does not claim production backend persistence, screenshot/layout acceptance, full release acceptance or a completed real generation flow.

After Stop, root must compare the complete captured final before staging it. Suggested coordinator-only commands (not executed by this specialist):

```sh
tail -n 180 .agent-logs/2026-10-12_04-34-26_01a12e63-f58e-7361-8c22-078723c01b78.md
PYTHONDONTWRITEBYTECODE=1 python3 scripts/capture/verify.py
git diff --check
git add src/client/use-studio.ts components/studio/StudioView.tsx src/client/checks/studio-state.mjs src/client/checks/reference-action.mjs docs/verification/submission-studio-selection.md .agent-logs/2026-10-12_04-34-26_01a12e63-f58e-7361-8c22-078723c01b78.md
git commit -m "Persist explicit preferred versions and repair upload selection"
git push origin main
```

Root must account for any already-integrated source changes and separately stage its own fixture/checkpoint changes. The future final is not claimed to have been emitted, captured or committed yet.
