# Creative duplicate — specialist handoff

Implemented in the original workspace on 2026-10-12 under the historical research exception. Research remains unresolved; this work does not pass that gate. Base commit inspected: `e247684d11c65cdc06b20de8ff51a6a002b3a980`.

## Capture and ownership

- Actual session: `01a131d1-df0b-7741-963c-3120a35211e7`; actual model: `gpt-6-astra`; CLI metadata: `0.162.0-alpha.17.2`; executed checks report Node `v24.18.0`.
- Automatic destination: `.agent-logs/2026-10-12_20-33-21_01a131d1-df0b-7741-963c-3120a35211e7.md`.
- Genuine source: `/Users/arhaan/.codex/sessions/2026/10/12/rollout-2026-10-12T13-33-20-01a131d1-df0b-7741-963c-3120a35211e7.jsonl`.
- Before implementation, a read-only comparison found the full 3,922-character actual task prompt in the automatic log. Session metadata confirms this original cwd. Root must compare the emitted final response after Stop; that evidence cannot exist before the response is emitted.
- This specialist wrote only the five assigned paths and preserved concurrent root/specialist work. No capture edits, children, worktrees, browser use, installs, provider calls, migrations, shared-contract edits, commits, pushes, or deployment. All generation allowances remain zero.

## Implemented behavior

Each saved Library card has a native **Duplicate saved shot** button outside its anchor. The original stays available; acknowledgement adds/refreshes the new card and announces **Copy created**, with **Open copy** and no navigation. Existing search, sorting, previews, and pagination remain in place.

The helper validates the saved title/draft with the existing create schema, allocates a different UUID, bounds the ` — Copy` suffix to the API's 80 UTF-16-unit limit without splitting a Unicode code point, and deeply freezes the validated payload. Only ID/title/draft enter `api.createProject`; reference IDs and preset relationship remain intact. No request key, job, generated asset, or preferred selection is copied.

A dedicated `frame-studio:duplicate-saved-shot:v1` localStorage entry holds one unresolved attempt. Storage must round-trip before each POST; denied, full, unreadable, malformed, or silently dropping storage stops creation. Reload only restores the recovery control; it never posts. An explicit retry validates source ownership with `api.project` under the current cookie and reuses the original payload, even after source edits. No guest rotation occurs. Known competing entries cannot be overwritten or removed by another attempt.

The synchronous ref lock prevents two clicks or retries from starting parallel requests. Expiry clears private cards, media, copy state, and recovery; lifecycle epochs suppress late source/POST completion after expiry or unmount. Network/quota failures retain the exact attempt. If acknowledgement cleanup fails, **Open copy** remains available and **Finish confirmation** retries local cleanup only. List errors disable copy controls until the list is recovered.

## Observed verification

| Command / method | Result and boundary |
| --- | --- |
| `node src/client/checks/library-state.mjs` | 51 passed: all original 31 plus 20 duplicate/controller checks. Mock React hooks/JSX/API, including two operations, reference preview after reload, double-click, lost acknowledgement, frozen retries after source edits, quota/network errors, source/create/list expiry, 404/mismatched source, late completions, storage failures, cleanup failure, query preservation, and reload races. |
| `node src/client/checks/duplicate-shot.mjs` | 11 passed: validation, title boundaries, payload isolation/freezing, durable recovery, storage failure protection, and real create/read/edit endpoints through the existing isolated SQLite harness. |
| Isolated real server harness | Image and motion copies retain same-owner reference IDs across GET/reload, have zero jobs/assets and null preferred asset, and edits leave the complete original detail unchanged. Upload happens once; duplication does not upload. Another owner cannot copy the private reference. All fetchers prohibit external calls. |
| Isolated quota replay | Created 19 projects, duplicated to project 20, changed the original, rejected a fresh 21st ID with 429, then replayed the original frozen copy ID/payload successfully with 200; count stays 20. A different payload with that ID returns 409. |
| Scoped ESLint on changed TS/TSX/check scripts | Passed with zero errors; two existing `no-img-element` warnings remain in Library. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Passed. No generated build files written. |
| `git diff --check` | Passed. |

No browser, focus/layout, actual browser storage, public deployment, full production build, or live-provider acceptance was run. Simultaneous independent browser tabs are not proven atomic; the helper checks known competing entries, but localStorage is not an inter-tab transaction. Root owns integrated browser acceptance and deployment.

## Root integration and CSS recommendations

Read and applied `/Users/arhaan/.codex/skills/apple-design/SKILL.md`: native controls with the existing immediate press feedback; specific labels; actions adjacent to their shot; honest status/error/completion feedback; and creator-controlled navigation. No extra motion is needed.

New hooks are `library-shot-item`, `library-shot-actions`, `library-duplicate-notice`, and `library-duplicate-actions`. Proposed additions to root-owned `styles/studio.css`:

```css
.library-shot-item { display: flex; flex-direction: column; min-inline-size: 0; gap: .625rem; }
.library-shot-item > .shot-card { flex: 1; }
.library-shot-actions { display: flex; min-inline-size: 0; }
.library-shot-actions > .button { inline-size: 100%; }
.library-duplicate-actions { display: flex; flex-wrap: wrap; gap: .75rem; }
.library-duplicate-notice > div > * + * { margin-block-start: .5rem; }
.library-duplicate-notice [role="alert"] { color: var(--danger); }
```

Keep focus outlines unclipped and retain existing responsive grid, button touch targets, and static reduced-motion feedback. Root should inspect long titles, narrow layouts and enlarged text; check image/motion copy, reference reload, edits independent of the original, explicit retry after lost acknowledgement, and keyboard access to the sibling action and Open copy link. No API/hook/schema/dependency integration changes are requested. Root should run both check scripts and verify the final automatic capture after Stop before Git/deployment work.
