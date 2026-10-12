# Independent creative interaction source review

Reviewer: task `creative-camera-study`, actual model `gpt-6-astra`, session `01a131d1-f3f9-7b63-b5b4-9d387b86ed77`. Reviewed original workspace source as A/B/root changes became available on 2026-10-12, approximately 20:38–20:42 UTC. No other owner's files were edited. This is source and controlled-check evidence, not a browser audit or a research-gate pass.

## Findings requiring coordinator disposition

### Medium, partially repaired: over-limit original needs a synchronous root guard

At `components/studio/MotionDirections.tsx:38`, `canUndo` only checks context and exact current text. Replacement at line 68 accepts the displayed valid proposal even when the previous draft is longer than 2,500 code points. Lines 73–75 save that oversized `before`, enable Undo, and tell the user that they can undo. The undo callback at line 84 then passes the old text to `src/client/movement-edit.ts:16`, which rejects every requested replacement above 2,500 code points. `StudioView.tsx:113` deliberately permits typing an oversized original, so the starting condition is reachable.

Observed reproduction from the actual component/root source harness: `node src/client/checks/prompt-directions.mjs` passes its case named `oversize original cannot be silently truncated by an attempted Undo`; the case creates an original of 2,501 `🎬` code points, applies a suggestion, attempts Undo, and asserts that the replacement remains with the message “Undo is no longer available.” No truncation occurs, but the advertised one-step recovery is false for this starting state.

Recommended disposition: root and B should agree a truthful policy before acceptance. With the existing contract that rejects every >2,500-code-point replacement, the safest small fix is to reject applying a suggestion against an over-limit latest original, keep that original intact, and explain how to shorten it first. That needs the root synchronous buffer guard as well as B's visible disabled/help state so a stale prop cannot bypass it. Alternatively, explicitly change the shared contract to permit exact restoration of the captured original without silently trimming it. Do not merely leave Undo enabled and fail after the user asks to recover their text. C does not own these paths.

**Follow-up at 20:43 UTC:** B has now added `currentTooLong` at `MotionDirections.tsx:38`, a local rejection at lines 63–65, visible help at line 112 and disabled replacement at line 114. The new ordinary over-limit case passes. The newly added stale-prop case at `src/client/checks/prompt-directions.mjs:268` **fails** at line 272: “Root must reject an oversized latest before value so it cannot replace a draft that Undo would reject.” At this review, `src/client/movement-edit.ts:16` still checks only requested `text`, not `current.prompt`. Root must add the latest-original length guard and rerun the suite; the B-only fix does not close the stale-render path.

### Integration prerequisite: reduced-motion CSS must also override the preview transform

At the reviewed snapshot, `styles/studio.css:345` disables CSS animation/transition globally, and line 347 resets transforms only for button/navigation/dialog classes. The newly added `.camera-study-image` rule at line 229 has no scoped reduced-motion transform override. The preview animates with WAAPI and uses an inline transform; disabling CSS animations alone does not implement the agreed CSS still-frame fallback. JavaScript preference handling is present and controlled-tested, but the task explicitly calls for matching JS **and CSS** behavior.

Root should add `.camera-study-image { transform: none !important; animation: none !important; transition: none !important; will-change: auto !important; }` inside the existing reduced-motion media query. See `creative-camera-study.md` for the remaining scoped recommendations. Real OS-setting changes and image clipping still need root's browser verification. C made no stylesheet edits.

## Reviewed behavior and supporting boundaries

- `components/studio/LibraryView.tsx:108`: a synchronous ref lock precedes asynchronous work. The source is re-read under the current session at line 123; line 131 persists the frozen recovery before line 133 posts it. Lines 124/134 and the expiry/unmount paths at lines 34–41/101–106 guard late responses. No guest-rotation call is introduced. The duplicate action at line 216 is a sibling of the card anchor, not nested in it.
- `src/client/duplicate-shot.ts:20`: validates the saved source and builds only ID, bounded copy title, and draft. Lines 17–18 freeze the attempt and nested payload/draft. The dedicated storage key at line 5 is separate from Studio recovery. Lines 39–49 verify storage round-trip before a POST can be reached; lines 55–65 conditionally clear only the matching recovery. No generated asset, request key, job or preferred-version field enters the create payload.
- `src/server/api.ts:57`: existing server source validates references, finds an existing same-owner ID and checks identical title/draft before inserting. This matches the retry-at-quota check without new server changes. Access/reference checks still apply to retries.
- `components/studio/MotionDirections.tsx:24`: context-keyed inner state resets disclosure, proposal, direction and Undo. Selection at lines 52–57 is local. The native radios and explicit proposal textarea at lines 94–105 keep choices and exact wording inspectable before replacement. The actual draft reference is passed to the preview at line 112 and close state remains observable by the child.
- `components/studio/StudioView.tsx:87` and `src/client/movement-edit.ts:12`: the callback uses the synchronous `studio.edit` boundary, reads current buffer text, checks context/task/limit/exact expected text, and changes only active movement prompt. The synchronous behavior is confirmed in `src/client/use-studio.ts:82`. Title, inactive draft, reference, parent and preset are structurally retained by the pure edit function.
- B's undo invalidation observes committed prompt prop changes (`MotionDirections.tsx:40`). Ordinary consecutive typing and returning to the applied text are covered. Multiple programmatic prompt changes that collapse back to the same value before any render are not observable through this props contract; no claim is made about that unrendered-history edge.

## Checks independently executed

| Command | Observed result | Boundary |
| --- | --- | --- |
| `node src/client/checks/library-state.mjs` | Initially 31 passed; latest rerun **48 passed** | Actual Library source in mocked hooks/JSX; latest tests include duplicate double-click, lost-ack/reload/frozen retry, expiry/unmount, quota/network/service failures, storage failure, wrong acknowledgement, query retention and cleanup confirmation. |
| `node src/client/checks/duplicate-shot.mjs` | 11 passed | Actual helper plus isolated SQLite/server API; image/motion copies, same-owner references, zero outputs/jobs/null preference, original unchanged after copy edit, lost-ack replay at quota 20. No external network/provider call. |
| `node src/client/checks/prompt-directions.mjs` | Initial 21-case suite passed; latest rerun **failed** after 21 passing cases | Actual helper/component/Studio callback with controlled hooks/editor buffer. New stale-prop oversized-original check fails at line 272 pending root's synchronous guard; see finding above. |
| `node src/client/checks/movement-edit.mjs` | 11 passed | Root pure edit/context guard checks. |

These are independent executions of the available implementation checks, not a replacement for root's integration acceptance. Browser duplication, real reload after lost acknowledgement, native keyboard/focus, actual media requests, layout at narrow widths, reduced-motion pixels and persistence of the full integrated flow were not run by C. Root retains browser ownership. The latest combined `prompt-directions && movement-edit` command stopped at the prompt-direction failure; the separate earlier 11-case movement-edit result remains the observed evidence for that file.

## Design disposition

The implementation follows the installed Apple Design skill's agency and predictability guidance: optional disclosure, explicit replacement, visible proposal, recoverable draft copy, and distinct local-study labeling. Preserve those semantics during CSS integration. Keep the Library copy control outside the navigation target with a 2.75rem minimum tap height and clear focus outline. Keep preview controls in normal flow, allow labels/status to wrap at narrow widths, and do not promote the local image study to the generated-output stage. The over-limit Undo issue is the concrete mismatch between the intended promise and the current source behavior.

Research remains unresolved under the authorized historical exception. Root must verify this session's emitted final response in the automatic log after Stop.
