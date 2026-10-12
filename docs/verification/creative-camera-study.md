# Camera study implementation and controlled verification

Task `creative-camera-study`, 2026-10-12. Implementation proceeds under the explicitly authorized historical research exception; the signed-in research gate is **not passed**. Original workspace `/Users/arhaan/Desktop/higgsfield-rebuild`, baseline `e247684`, Node `v24.18.0`. No browser, provider, spending, installs, schema changes, children, worktrees, commits, pushes or deployment in this task.

## Capture

- Actual model: `gpt-6-astra`; source session: `01a131d1-f3f9-7b63-b5b4-9d387b86ed77`.
- Automatic log: `.agent-logs/2026-10-12_20-33-26_01a131d1-f3f9-7b63-b5b4-9d387b86ed77.md`.
- Genuine source: `/Users/arhaan/.codex/sessions/2026/10/12/rollout-2026-10-12T13-33-25-01a131d1-f3f9-7b63-b5b4-9d387b86ed77.jsonl`.
- Before production edits, a read-only Python comparison verified the entire 3,441-character task prompt from the source user `response_item` occurs exactly in the automatic log. Source timestamp `2026-10-12T20:33:26.726Z`; source metadata confirms original cwd and CLI `0.162.0-alpha.17.2`; actual `turn_context.model` is `gpt-6-astra`.
- Capture was never edited. Final-response coverage must be verified by root after Stop; it cannot be asserted before emission.

## Behavior and design decisions

`CameraStudyPreview.tsx` consumes only the agreed `reference`, `direction`, `contextKey`, and `open` props. Its only runtime import is React; catalog/Asset imports are type-only. It renders the actual passed image URL, with no sample fallback. The img node and URL remain unchanged during Play, Stop and Replay. The persistent title and explanation are exactly:

> Camera study · 5 seconds
>
> Local movement of your reference image. This is not an AI-generated video.

One explicit Play runs five seconds, followed by explicit Replay; Stop resets to initial framing. A centered 1→1.06 scale represents push-in. Pan translates -2%→2% on an image enlarged to 1.08; locked stays stationary. There is no autoplay, loop, download, encoding, timeline, orbit, parallax or mutation of draft/project/selection/preferences/assets/jobs. Only the image's normal GET is introduced.

The component uses WAAPI transforms plus an independent five-second timeout. Context/task identity, reference identity/URL, direction, close, hidden page, reduced-motion changes, image error and unmount cancel the animation and timer. A sequence token rejects late timer callbacks. Replay cannot double-start before React rerenders. The completed frame remains still until Replay/Stop/reset. Stop is enabled during playback.

Unknown motion preference starts still. A live `matchMedia` listener and a synchronous Play check enforce reduced motion; reduced motion shows a still with an explanation and disabled Play. Browsers without the animation API get a still and honest unavailable status rather than stuck playback. Missing, loading, error and ready states are distinct; cached image completion is checked. Old URL handlers/currentSrc mismatches are ignored. Native image events have no request ID: an indistinguishable stale event on the same node/current URL cannot be categorically attributed, so the implementation additionally checks complete/naturalWidth rather than claiming perfect request provenance.

Read and applied `/Users/arhaan/.codex/skills/apple-design/SKILL.md`: local, explicit controls preserve agency; immediate interruption respects user intent; bounded transform-only motion avoids distraction; static reduced-motion feedback preserves meaning. Existing cinematic typography/tokens remain authoritative. No new visual theme or dependency.

## Observed checks

- `node src/client/checks/camera-study.mjs`: **18 passed**, actual component transpiled with installed TypeScript and executed in a controlled VM hook/image/media-query/timer harness. Cases include one 5,000 ms run, no loop/autoplay, synchronous double-click, Stop/Replay, immutable input, same image/src/key, cached load, missing/error/loading, removed/restored reference, stale load/error events, context/task/direction/close/pagehidden reset, live and event-race reduced motion, locked stationary, unavailable WAAPI and unmount cleanup/late callbacks.
- `./node_modules/.bin/tsc --noEmit --incremental false`: **passed** (exit 0), with B's catalog/component available. No emitted build artifact.
- `./node_modules/.bin/eslint components/studio/CameraStudyPreview.tsx src/client/checks/camera-study.mjs`: **passed** (exit 0, zero errors). One advisory `@next/next/no-img-element` warning remains at the actual image; direct img is intentional to preserve the original URL/node and avoid introducing an optimization request. Initial harness naming-rule errors and an unused suppression were corrected in the owned files.
- No real browser assertions, real image network/decode verification, screenshots, compositor smoothness, focus review, CSS geometry verification, or provider calls. These remain root integration checks.

## Required root CSS and integration

Root owns `styles/studio.css`; C made no CSS edits. The following scoped rules are recommendations and prerequisites for a polished/correctly clipped preview. Keep the existing `.button` focus/disabled styles. No CSS keyframes are needed.

```css
.camera-study { display: grid; gap: .75rem; min-inline-size: 0; padding-block-start: 1rem; border-block-start: 1px solid var(--border); }
.camera-study-heading { display: grid; gap: .375rem; }
.camera-study-heading h4 { font-size: .875rem; font-weight: 600; line-height: 1.4; }
.camera-study-frame { position: relative; overflow: hidden; isolation: isolate; aspect-ratio: 16 / 9; inline-size: 100%; border: 1px solid var(--border); border-radius: .5rem; background: var(--media-bg); }
.camera-study-image { position: absolute; inset: 0; inline-size: 100%; block-size: 100%; max-inline-size: none; object-fit: cover; transform-origin: center; }
.camera-study[data-playing="true"] .camera-study-image { will-change: transform; }
.camera-study-placeholder { position: absolute; inset: 0; display: grid; place-items: center; padding: 1rem; color: var(--text-secondary); font-size: .875rem; text-align: center; }
.camera-study-controls { display: flex; flex-wrap: wrap; gap: .5rem; }
.camera-study-status { min-block-size: 3em; }
@media (prefers-reduced-motion: reduce) {
  .camera-study-image { transform: none !important; animation: none !important; transition: none !important; will-change: auto !important; }
}
```

The image must cover the **same box** whose overflow is clipped. At scale 1.08, its edges extend 4% beyond each side; ±2% translation retains a 2% horizontal margin. Check portrait/landscape references in the actual browser because this controlled harness does not lay out pixels. Root may adjust size/spacing, but must retain object-fit cover, clipping, centered origin and matching reduced-motion override. Preview is intentionally small within the helper, not the output stage.

B imports the component and keeps it rendered inside collapsed content with `open=false`; root supplies the actual draft start frame and context including project/new, task, startAssetId, parentAssetId and presetId. A task switch must unmount the helper or change context. Do not key the img or change its URL for playback. Root should verify close/pagehide and OS preference changes in the browser, then independently accept or drop this optional preview.

## Status

Component and focused harness are ready for root integration. Browser/CSS acceptance and final capture verification remain explicit dependencies; independent A/B source findings are recorded separately in `creative-independent-review.md`.
