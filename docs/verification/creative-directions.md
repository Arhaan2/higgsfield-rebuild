# Camera direction ideas — specialist verification

Task: `creative-directions`. Component complete; integration edge guard unresolved. Original workspace; historical research exception remains in effect. Research is **not** claimed passed. No browser, provider calls, spending, installs, schema changes, capture edits, commits, pushes, children, or worktrees were used.

## Capture and scope

- Actual model from the session's `turn_context`: `gpt-6-astra`.
- Session: `01a131d1-ea75-7da1-b828-f5ff57c591e4`.
- Genuine source: `/Users/arhaan/.codex/sessions/2026/10/12/rollout-2026-10-12T13-33-23-01a131d1-ea75-7da1-b828-f5ff57c591e4.jsonl`.
- Automatic destination: `.agent-logs/2026-10-12_20-33-24_01a131d1-ea75-7da1-b828-f5ff57c591e4.md`.
- Before production edits, Python extracted the actual user message from the source and verified its full content matched both `docs/agents/handoffs/34-creative-directions.txt` and the automatic log. Actual prompt SHA-256: `749e9761348268f1926f646a3d63b3fadcd484bf6e739523ca43c510e1c81de4`.
- Final-response coverage awaits root's post-Stop verification. This document is not a substitute for raw capture.
- Exclusive changed paths: `components/studio/MotionDirections.tsx`, `src/client/prompt-directions.ts`, `src/client/checks/prompt-directions.mjs`, and this document. Root's contemporaneous integration/styles and C's preview were read only.

## Result and design decisions

The native `details` disclosure starts collapsed, with the exact summary **Camera direction ideas**. Native radios expose **Push in**, **Pan across frame**, and **Locked frame**. The selected catalog wording appears in an editable **Proposed movement text** field. Selection, opening, and proposal editing make no draft changes. **Replace movement text** applies exactly the visible proposal, including its whitespace. **Undo replacement** uses the callback's captured `before`; the rendered prompt never supplies that snapshot.

The component passes C's actual reference, selected direction, context key, and open state to the always-mounted preview child. The child receives `open=false` on collapse. Context keys remount local state; switching tasks removes the helper. Title edits retain local choices and valid Undo. Copy explicitly identifies prepared writing suggestions and says they do not guarantee camera control. No save or generate action is exposed by the helper.

The installed `/Users/arhaan/.codex/skills/apple-design/SKILL.md` was fully read. Applied principles: Agency through preview and guarded Undo; Familiarity through native disclosure/radios; Simplicity through an initially collapsed optional tool; clear labels and inline status/error feedback. This is implementation guidance, not a claim of new product research or visual/browser acceptance.

Undo is discarded after an observed prompt change and cannot revive when later typing returns to the applied string. It is also discarded on context/task remount, a newer replacement, successful Undo, or a rejected atomic Undo. Root receives `expectedCurrentPrompt=after` on Undo to reject a change that occurred after render. The component cannot observe edits hidden entirely between equal prop values; ordinary input events must continue rendering the current prompt. An integration that later batches edit-and-return operations into one identical prop value would need an explicit edit identity/remount mechanism.

The proposal is counted in Unicode code points. There is no `maxLength`, trim, normalization, or truncation. An oversized proposal remains visible and is rejected before the callback. An already oversized current draft also disables replacement so the full original remains recoverable. Root must apply the same original-length guard against its latest buffer, covering an oversized edit that has not rendered yet.

## Observed verification

Node was observed as `v24.18.0` at `/Users/arhaan/.nvm/versions/node/v24.18.0/bin/node`.

| Command / check | Observed result | Boundary |
| --- | --- | --- |
| `node src/client/checks/prompt-directions.mjs` | 21 checks passed; added 22nd check fails (exit 1) | Actual component, actual StudioView callback, actual root movement helper; controlled React hooks and synchronous editor buffer; C's child is opaque |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Exit 0 with C's file present | Full project type check; no build artifact written |
| `node node_modules/eslint/bin/eslint.js components/studio/MotionDirections.tsx src/client/prompt-directions.ts` | Exit 0 | Assigned implementation paths |
| `node node_modules/eslint/bin/eslint.js src/client/checks/prompt-directions.mjs` | Exit 0 | Assigned controlled check file |

The 21 checks cover all selections without mutation; exact proposal application; unchanged title, reference, parent, preset, task and inactive image draft; Unicode/CRLF/multiline/blank/whitespace Undo; newer callback buffer versus stale prompt prop; typing then returning to applied text; unrendered edit rejection by the atomic guard; replacement supersession; identical-text no-op; title stability; reference/parent/preset/project resets; task unmount/remount; 2,500 versus 2,501 astral code points; blocked editing; active preview props and collapse; and visible oversized original preservation. Frozen fixture objects detect accidental field mutation. Save, generate, and upload throw if invoked by the tested action.

The added regression **root rejects an oversized latest original even when its prompt prop has not rendered yet** fails against root's current implementation: an unrendered 2,501-code-point buffer is replaced by the valid proposal. The captured original cannot subsequently pass root's 2,500-code-point Undo guard. This is a reproduced integration gap, not a passed check. Root owns `src/client/movement-edit.ts`; this specialist did not edit it. Proposed correction: include `[...current.prompt].length > 2500` in its rejection condition, preserving the exact buffer; then rerun the 22-case component check and root's own movement checks.

Not run here: actual browser layout, disclosure/radio keyboard interaction, focus/assistive-technology behavior, native preview playback, reload/recovery/save/export/download, production build, or deployment. Root owns these checks. The controlled harness does not execute `useStudio` persistence or C's animation implementation.

## Integration requests and CSS handoff

Root's `StudioView` integration and scoped styles were observed during this task. Preserve the synchronous callback, full context identity, motion-only placement and optional exact-current guard. Required remaining edge guard: in root-owned `replaceMovementText`, reject a replacement when the latest `current.prompt` exceeds 2,500 code points, preserving the buffer identity. Otherwise a stale rendered prop could allow replacing an oversized original which root's Undo length guard cannot restore.

Component class hooks: `motion-directions`, `motion-directions-summary`, `motion-directions-content`, `motion-directions-options`, `motion-direction-option`, `motion-directions-wording`, `motion-directions-proposal`, and `motion-directions-actions`; existing `field-group`, `field-label`, `field-help`, `prompt-input`, `error-text`, and button variants are reused.

The currently observed root CSS covers the main hooks. Recommendations: retain the native summary marker and visible focus outline; keep summary/radio label/button targets at least 2.75rem; use `min-inline-size: 0` and wrapping labels; let actions stack within the narrow composer; keep editable text visible with the existing textarea resize behavior; distinguish checked radio cards with both their native indicator and border; avoid animating the disclosure or adding looping decoration. The otherwise optional `motion-directions-wording` hook requires no additional styling. No style file was edited by this specialist.

Next: root adds/verifies the latest-original length guard, performs integrated browser/reload/export acceptance, and verifies the real final response in capture after this session stops.
