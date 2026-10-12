# Frontend integration — p3-frontend-001

Frontend markup and client state are implemented in assigned paths. No browser, provider, package, infrastructure, Git mutation, or deployment was invoked. Styles remain designer-owned; shared contracts/config/catalog remain root-owned.

- Routes: `/`, `/studio`, `/studio?sample=dune-study`, `/studio?preset=<catalog id>`, `/studio?project=<UUID>`, `/library`.
- API client consumes the agreed JSON envelopes and raw JPEG/PNG upload route. Explicit Save acknowledges only returned revisions; app navigation awaits saves. Both task buffers have browser recovery; the server stores the active task. Sample inspection creates no guest/project. Preset use creates a real saved draft. Failed replacements retain the previous start frame.
- Job retry retains the original request key and revision, including across reload. Refresh has backoff, hidden-page pause, and in-flight deduplication. No client-side job mocks or generated sample history exists.
- Root: verify browser behavior after backend/style integration: upload → save → reload → inspect → reuse; both mode buffers; two-tab revision conflict; failed upload; guest expiry; native dialog focus return; sample playback/seek/download; 320/390/1024/1440 widths and reduced preferences. No rendered review is claimed by this worker.
- Root: leave live generation disabled with zero cap. This worker has made no live or local HTTP job submission.
- Full `npx tsc --noEmit` passed initially and again after integration at ~02:03 UTC. An intermediate concurrent `src/server/jobs.ts:17` capabilities-reason type error was resolved by its owner; frontend never edited that file. Targeted ESLint passed with zero errors and ten native-image optimization warnings; images deliberately use original same-origin media URLs, including cookie-protected media.
- Eleven isolated client-state checks passed: `node src/client/checks/studio-state.mjs`. Cases cover sample lazy creation, stale save response, acknowledgement, both buffers, revision conflict, failed navigation save, expiry, failed upload retention, same-key/revision ambiguous retry under later zero cap, server-normalized draft comparison, and lost project-creation response recovery. This uses a minimal hook-state harness and mocked API, not a React renderer, browser, backend service, or provider. The product itself has no mocked API/results.

Capture: `01a12dca-22b5-78c1-b303-80917297eb61`, actual `gpt-6-astra`, `.agent-logs/2026-10-12_01-46-25_01a12dca-22b5-78c1-b303-80917297eb61.md`. Full 5,701-character assignment matches verbatim. Root must verify this worker’s final after emission and update phase status.

No shared interface change is currently requested. Root should integrate its completed backend and designer styles, retain the zero-spend configuration, run its owned end-to-end/browser checks, and verify/commit this final capture only after it is emitted. No deployed usability or live provider success is claimed.
