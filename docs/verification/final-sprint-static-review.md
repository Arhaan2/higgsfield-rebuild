# Final sprint source review

**Verdict: review preparation complete; integration/public acceptance not run.** Read-only source inspection and historical screenshot review, 2026-10-12. Scope: export shot brief, Library search/filter/sort and their narrow layout/accessibility integration. No product edits, browser, network requests, dependency installs or product test executions.

## Capture and evidence boundary

Session `01a131a4-4f76-74f3-96a2-05d7fc767531`; automatic destination `.agent-logs/2026-10-12_19-43-35_01a131a4-4f76-74f3-96a2-05d7fc767531.md`; actual recorded model `gpt-6-astra`. Read the full automatic assignment before substantive review. A read-only Python comparison then confirmed the entire 2,967-character prompt exactly equals its genuine user `response_item` in `/Users/arhaan/.codex/sessions/2026/10/12/rollout-2026-10-12T12-43-34-01a131a4-4f76-74f3-96a2-05d7fc767531.jsonl`. Prompt SHA-256: `aafe5e6bea7153b46ec0ee773e7180ba53072c4fcf361e0d4f881df88085af08`. Log suffix after the prompt was three newlines. Capture was not modified. Final/source comparison remains root's task after Stop.

Read AGENTS, TEAM, handoff template, STATUS, assignments 29–31, walkthrough, relevant Studio/Library/details/shell components, hook save state, contracts, sample catalog, Library check source and shared CSS. Applied installed `/Users/arhaan/.codex/skills/apple-design/SKILL.md`: purpose/agency, immediate feedback, grouping, flexible layout, typography and accessibility. Existing studio identity is retained.

The inspected working source had no Export shot brief or Library query toolbar. Findings below are baseline observations and proposed integration requirements, not judgments of the specialists' future implementations. Assignment reports starting source `main432d3d9`; no Git operation was performed. Content fingerprints identify the inspected files independently:

| File | SHA-256 at inspection |
| --- | --- |
| `components/studio/StudioView.tsx` | `4c7e2bab6f22c8c09e241aaeacd22a22cdcfbb7047674b94fbda5399a5ce3d31` |
| `components/studio/LibraryView.tsx` | `3b18e8bdfad4f5fc204408f4d1e0e6a4fa977dd512feb750d7f42a3b1f2f0f1d` |
| `styles/studio.css` | `8228ae52d2a5bd8fb88d3b32b0a88a973d9961a5e0b7d48f5dbb0b465e86c393` |
| `docs/WALKTHROUGH-SCRIPT.md` | `13d66fee0a69b7f3eebabca0ccebf7d905627a97c20441ed5e0666e007ea4eca` |

Visually inspected `deployed-studio-mobile.jpg` and `deployed-library-mobile.jpg`. Per `deployed-browser.md`, these are historical 390px captures from deployed source f271258 / Worker cbe42062-203d-462c-949e-0d4bd380beac. Studio shows a long composer with preview jump below draft actions; Library shows saved cards and a separate prepared collection without a toolbar. They motivate placement and wrapping recommendations only. Their prior no-overflow evidence cannot be transferred to the additions. Full-page fixed-nav placement also cannot by itself prove live scroll obstruction.

## Narrow recommendations to root

| Priority | Inspected source / observation | Requested integration |
| --- | --- | --- |
| Important | `StudioView.tsx:83–85`: disabled Generate uses primary class; Save uses secondary. CSS `:disabled` at 110 neutralizes Generate, leaving no enabled brass draft action. | When generation is off, give available Save `.button-primary`; keep Generate and its reason. Export stays secondary. Existing `.composer-actions > .button-primary` at CSS 197 supplies the 3rem action height; no new color token or animation needed. |
| Important | `StudioView.tsx:38` resolves draft reference independently of inspected asset at 35–37. Hook `saved` at `use-studio.ts:426` compares acknowledged signatures, but `recovery.ts:15–18` trims title/prompt. Whitespace-only edits can therefore still satisfy that flag. | Export the active buffer and actual draft reference in one snapshot. Compare exact exported fields with confirmed project content before claiming a saved revision; `studio.saved` alone is insufficient. Preserve whitespace and label any mismatch unsaved. Keep requested settings separate from original media facts. No selected-image fallback when a draft reference is absent. |
| Important | Header actions already wrap (`studio.css:98–99,287`); preview target is focusable (`StudioView.tsx:92`), current jump is below composer (`85`). `AppShell.tsx:12` exempts fragment links from its save/navigation guard. | Move the existing jump into header actions only when an asset is inspected. Retain `href="#selected-output"`, `.button` focus/target styling and useful keyboard destination. Prefer **View reference**, **View sample**, or **View result** according to actual source; never imply prepared footage is generated. |
| Important | Library fetch callbacks at `LibraryView.tsx:24–76` merge fresher details and guard stale responses; rendering at 90–96 distinguishes errors, loading, emptiness, cards and sample collection. | Derive query results from merged `projects`, preserving original arrays and stable ID keys. Keep query state out of fetch dependencies. Place a labeled toolbar above saved results, outside card anchors and sample collection. Use ordinary search input/select/button semantics; no ARIA toolbar role requiring custom arrow navigation. |
| Important | `.text-input` styling at CSS 169 supplies 1rem text/44px controls; global focus styling at 72 includes selects. No Library toolbar styles exist in inspected CSS. | Reuse `.field-group`, `.field-label`, `.text-input` and `.button`. Give search/filter/sort visible labels and `id`/`htmlFor`; native selects can use `.text-input`. Put result count in one persistent `role="status" aria-atomic="true"` node; avoid a live region around the whole card grid. Reset should not remove the focused control without returning focus to search. |
| Important | Empty state currently depends on total `projects.length`, not filtered results (`LibraryView.tsx:92`). A cursor renders a separate Load more (`94`). | Add distinct no-matches messaging only after loading and when loaded saved shots exist. Qualify count/no matches to loaded shots when cursor remains. Keep list failure, expiry and partial-preview warning visible independently of matches; avoid claiming a failed preview means zero generated versions. |

Proposed **new selector names**, for root to reconcile with the specialist's markup; these are not claimed to exist. This small flex layout permits wrapping without changing the palette or making another sticky/translucent layer:

```css
.library-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: .75rem;
  margin-block-end: 1rem;
}
.library-toolbar > .field-group { flex: 1 1 10rem; min-inline-size: 0; }
.library-toolbar > .library-search { flex: 2 1 16rem; }
.library-toolbar select { max-inline-size: 100%; }
.library-query-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: .5rem .75rem;
  margin-block-end: 1rem;
}
.library-query-summary > p { min-inline-size: 0; overflow-wrap: anywhere; }
```

Search/filter labels retain `.field-label`; the count uses `.field-help`. Existing `.button` provides press feedback and 2.75rem targets (CSS 101–108). Existing reduced-motion, reduced-transparency, increased-contrast and forced-colors rules at 308–330 should remain effective; their source presence is not a native-preference test. Do not add sorting animations, debounce delay or custom dropdown machinery for a maximum 20-shot Library.

## Verification and handback

Actual checks: full-prompt/source equality; source and historical-image inspection; SHA-256 file identification. A read-only Python document check verified nine contiguous intervals whose individual durations and sum equal 265 seconds (4:25), six unique browser checklist IDs and balanced Markdown fences. Browser, downloaded export, integrated query behavior, native assistive technology, generation and recording checks are **not run**. Root must integrate CSS/markup, inspect specialist checks, update the root-owned walkthrough/status, and obtain fresh public evidence. Ownership of both assigned evidence files returns to root with the final handoff.
