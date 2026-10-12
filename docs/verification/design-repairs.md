# Phase 5 draft action and attribution repairs

Task `p5-draft-action-repair-001` · Frontend · 2026-10-12 UTC. **Partial: scoped repairs implemented; delayed-save regression needs the root-owned hook.** No browser, provider, Git, deployment, capture edits, dependencies or delegated agents. Spend $0. V3/P4 remain pending under the supplied exception; this report does not advance phase acceptance.

## Implemented

- `StudioView.tsx` and the pure `reference-action.ts` distinguish **Edit movement** (same motion reference) from **Use as start frame** (different reference). The same-reference path makes no save or draft replacement; image mode switches through the existing hook while retaining the motion draft object. Different-reference reuse retains the exact nonempty motion text, including whitespace, or initializes an empty string with the existing movement preset. Its parent remains the selected image, consistent with previous lineage semantics.
- Both actions explain that they edit a draft and do not generate. `AssetDetails.tsx` receives an explicit label, explanation and callback; prepared samples retain their original primary **Use suggested prompt** behavior alongside a separate start-frame action. Focus is requested in a React effect after the details dialog has unmounted, so its focus-return cleanup runs first. Native focus behavior still needs root's browser check.
- Attribution occupies its own row immediately after provenance. The existing attribution component preserves author, destination and new-tab behavior. Additive `.detail-attribution` CSS supplies a wrapping inline-flex anchor, a visible border, minimum 44×44 px, regular in-flow padding and visible focus. This is source verification, not a measured target/layout pass.
- Source confirmed polling updates change job status without setting the global notice except on success. Job heading/explanation now have an atomic polite `status` region; `failed` and `transfer_failed` use assertive `alert`. Poll timestamps and action buttons remain outside the live region to avoid repeated time/button announcements. Spacing is preserved with one narrow selector. No refresh, retry or polling behavior changed; actual assistive-technology announcements remain unverified.

Read the installed `/Users/arhaan/.codex/skills/apple-design/SKILL.md`. Applied §16 agency/specific labels, §10 and §16 target flexibility, and status/error feedback. The 44 px requirement comes from this project's accepted design contract. No motion or visual redesign was introduced.

## Actual checks

- `node src/client/checks/reference-action.mjs`: **17 passing checks, one failing delayed-save regression; exit 1.** Loads the actual StudioView, AssetDetails, reference helper and useStudio code with mocked React hooks/API. Covers saved/unsaved × image/motion mode × same/different reference, exact whitespace/newline preservation, zero calls for same-reference reuse, inactive image text, default only for empty movement, immutable frozen job/asset fixtures, details callbacks/close/focus request, independent sample suggestion behavior and five job live-region states. No browser, real persistence, native dialog/focus, layout, screen reader or provider assertions.
- `./node_modules/.bin/tsc --noEmit --incremental false`: passed, exit 0.
- `./node_modules/.bin/eslint components/studio/StudioView.tsx components/studio/AssetDetails.tsx src/client/reference-action.ts src/client/checks/reference-action.mjs`: passed, exit 0; five existing `@next/next/no-img-element` warnings, zero errors.

## Required root hook repair

The integrated regression delays the first save after **Use as start frame**, types `newer typing during save`, then releases that save. `beforeNavigate` acknowledges the newer text, but `forkDraft` subsequently applies its argument captured at click time (`at click`), replacing the newer motion text. This is an actual failure against the local hook with a deferred mock save, not a browser reproduction. The nonconcurrent cases above pass. Hook ownership was respected; no UI workaround bypasses its save/context protections.

Requested minimal contract change: allow `forkDraft` to accept `Draft | ((current: EditorBuffer) => Draft)`, resolving the callback inside its existing `edit(current => ...)` after `beforeNavigate` and context checks. Preserve pending-request identity and expired/conflict/session protections at that boundary. Root should then change the different-image call to a resolver using the shared helper and the **current** `current.drafts.image_to_video`, falling back to that existing motion draft when the helper returns null. Existing original/suggested-prompt value calls keep their current behavior. A dedicated hook reference action with equivalent atomic semantics is also valid. Root owns this integration after handoff; the new regression deliberately remains red until it is fixed.

Root then reruns the action check, TypeScript and targeted lint; reproduces saved/unsaved same/different-image actions and image-mode switching in the browser; checks details closure and actual prompt focus; measures attribution at 320/390 px and enlarged text; verifies focus/new-tab navigation and live announcements. Independent reviewer rechecks. No production snapshot/provider result is claimed.

## Capture

Session `01a12e2b-6e9c-7972-a536-1e9cc19e21d2`; automatic destination `.agent-logs/2026-10-12_03-32-41_01a12e2b-6e9c-7972-a536-1e9cc19e21d2.md`; recorded model `gpt-6-astra`. Full prompt read before edits, then all 3,281 characters of `docs/agents/handoffs/19-frontend-review-repairs.txt` (excluding trailing whitespace) verified verbatim in that log. Final response has not yet been emitted at report authoring; root must verify its actual automatic capture afterward. Logs were read only.
