# Saved start-frame Library preview

Task `submission-library-startframe-001`, Frontend, 2026-10-12 UTC. Bounded repair complete; root owns integration, browser verification and capture closure. Supplied submission prerequisites and the explicit R1 exception are unchanged; R2 remains blocked. No spending occurred.

## Reproduction and change

Before changing `LibraryView.tsx`, added a component-output regression using the actual public catalog and both image-to-video presets (`slow-reveal`, `desert-drift`). Running `node src/client/checks/library-state.mjs` passed the six existing checks, then exited 1: thumbnail source was `undefined`, expected `/samples/dune-light.jpg`.

Library now selects the preferred retained asset from the current detail's `preferredAssetId`, then the existing last-retained-asset fallback. Only an assetless image-to-video draft with a start reference resolves a fallback: public catalog first, otherwise the existing owner-scoped `api.asset(startAssetId)`. The external read requests exactly that reference; mismatched IDs and non-image references become recoverable preview failures. It neither copies assets nor adds fallback references to generated counts or jobs.

Successful details refresh the card's project metadata, including title and operation, so stale list metadata cannot select the wrong preferred asset or start frame. Generation count still comes exclusively from this shot's retained assets with `source === "generation"`; request status still comes exclusively from its returned jobs. Assetless text drafts and motion drafts without a start frame retain the empty preview.

Reference fetch errors use the existing unavailable notice and targeted retry. Existing epoch checks cover the added asynchronous lookup, reject stale successes/expiry, prevent reference reads after stale detail completion, and clear private cards immediately on current-session expiry. Existing shot links, styles and controls remain intact. Applied the installed Apple Design skill's predictability, honest feedback and recoverable interaction guidance without changing the visual system.

## Verification actually run

| Command | Observed result |
| --- | --- |
| `node src/client/checks/library-state.mjs` before implementation | Exit 1, reproduced missing preset thumbnail after six original passes. |
| `node src/client/checks/library-state.mjs` after implementation | **15 checks passed**: six original checks and nine added checks, with multiple cases per applicable check. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Exit 0; no emitted or incremental artifact. |
| `node node_modules/eslint/bin/eslint.js components/studio/LibraryView.tsx src/client/checks/library-state.mjs` | Exit 0; zero errors, two existing `@next/next/no-img-element` warnings. |

Added coverage verifies both real preset start-frame URLs and zero generated versions; preferred/retained precedence using current detail; stale list metadata; empty text/no-frame drafts; a generated external reference without count or job contamination; exact-ID asset reads; mixed successful cards and missing/unavailable references with targeted recovery; mismatched project/asset IDs and non-image references; immediate reference expiry with a pending sibling; stale reference success/401 after a newer load; and no external lookup after unmount during a delayed detail request. Original detail failure, retry, expiry and unmount checks remain passing.

The screenshot-equivalent evidence is the actual component's returned JSX tree under mocked hooks/API: each preset-only saved card contains an `img` with `src="/samples/dune-light.jpg"`, its actual `/studio?project=…` link, `Motion draft · 0 generated versions`, and no invented latest request. The catalog data is loaded from the real source file; API responses and hook scheduling are mocked. This is **not a screenshot or a real React/browser rendering test**, and does not verify image downloads, layout, keyboard interaction or live backend authorization. Owner scoping was confirmed by read-only inspection of `src/server/api.ts` and `src/server/store.ts`; no backend request was made.

## Capture, ownership and next action

Before substantive work, verified that the entire assigned prompt from `docs/agents/handoffs/25-library-startframe.txt` appeared verbatim in the automatic log:

- Session: `01a12e64-03d6-74b1-b501-aacd07e53e1d`.
- Destination: `.agent-logs/2026-10-12_04-34-30_01a12e64-03d6-74b1-b501-aacd07e53e1d.md`.
- Recorded model: `gpt-6-astra`; prompt timestamp: `2026-10-12T04:34:30.267Z`.
- No log was edited. The final response must be verified by root after emission.

Only the three assigned paths were edited: `components/studio/LibraryView.tsx`, `src/client/checks/library-state.mjs`, and this report. Original review reports were preserved. No browser, provider, billing, child agent, install, Git, publishing or deployment action was performed. No shared contract/configuration or integration patch is required. Root should verify the integrated preset-only card in its browser, confirm final-response capture, then update the shared checkpoint and handle any commit/push under its existing authority.
