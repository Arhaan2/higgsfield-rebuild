# One shot, visible iterations

Task `p2-design-001` · Designer · 2026-10-12 UTC · Phase 2 specification, awaiting coordinator integration. This describes intended behavior, not a rendered or tested application. R1 remains incomplete; the user-authorized research exception permits this work. Spending remains disabled at zero; separate original-site upload terms remain unapproved.

## Direction and evidence

A quiet charcoal workspace with warm ivory type and a restrained brass action color. The working identity is **Higgsfield / Studio**; root may adapt the name. Recognition comes from cinematic previews, prompt-led creation and connected image/video work. Media occupies the largest region. No glowing gradients, decorative metrics, fake device controls or catalog-scale navigation.

| Recorded observation | Design decision / intended improvement |
| --- | --- |
| [I01/I03](../recon/flows.md): one preliminary title/model mismatch; later signed-in layout differed | Task heading, prompt label, model facts and CTA always agree. This addresses a bounded observation, not a universal original-product defect. |
| IF01/IF02: displayed Free could fall back to paid credits | Persistent `Live generation off` status; explicitly separate sample inspection from submission. No sample action dispatches a generation request. |
| IF02/AS01/I03: real asset reuse, motion handoff and reload retention | Keep source, immutable versions and changed prompt together. History/reuse already exist in Higgsfield; clearer local context is the proposed improvement, not an invented original feature. |
| C01: Cinema narrow view displayed a mobile restriction | Supply the same essential workflow in a linear phone layout; usability remains to be checked. |
| MS01/EF01: presets populated meaningful forms | Small Explore collection fills the supported prompt/task only; preview is labeled independently of any future result. |

Skill read: **apple-design**, `/Users/arhaan/.codex/skills/apple-design/SKILL.md`. No version declared and no separate required reference files. Applied sections: §1 immediate press feedback; §3 interruptible input; §7 consistent entry/return locations; §12 material hierarchy; §14 independent motion/transparency/contrast preferences; §15 system typography with size-specific tracking/leading; §16 purpose, agency and control-to-content mapping. See exact values in [tokens.md](tokens.md). Use native scrolling rather than inventing draggable panels; no animation dependency is required for this scope. Interactive prototype/user evaluation (§17) belongs to implementation verification, not this handoff.

## Composition and responsive order

All dimensions below are CSS pixels at a 16px root; implement scalable sizes in rem. Minimum supported layout: 320px wide. Document scroll is the default; avoid nested full-height scroll traps. Layout caps at 1680px including navigation.

```text
Desktop ≥1200
┌ 96 nav ┬ 64-high header: Studio / shot title       Live generation off ┐
│ mark   ├ 320 control rail ┬ 24 gap ┬ flexible output stage (min 0)      │
│Explore │ task            │        │ result title / Sample badge       │
│Studio  │ start frame     │        │                                    │
│Library │ prompt          │        │        media: contain              │
│        │ model · 5s      │        │                                    │
│        │ status / CTA    │        │ playback / contextual actions      │
│        │                 │        │ V01 → V02 / parent / change        │
└────────┴─────────────────┴────────┴────────────────────────────────────┘
```

Navigation uses 20px icons above 12px labels, three destinations only; each item is 64×56 with a solid selected background and visible current-page marker. Main padding 32; rail/stage gap 24. Header title and action cluster wrap when required. Rail has 20 padding and 24 between field groups. Stage has 24 padding; media well uses `aspect-ratio:16/9`, minimum height 240 and maximum height 60svh on desktop. Actual media uses `object-fit:contain` against near-black; preserve portrait/source proportions. Do not stretch or crop an output to match its card.

At **768–1199px**, nav is 80 wide, page padding 24, rail 288, gap 16; stage minimum height 200. At **below 768px**, use a 56-high top bar and 64-high bottom navigation plus safe-area inset. Page padding 16; leave bottom space equal to navigation plus 24. One stable DOM/read order: title/status → task → start frame → prompt → model facts → submit/status → selected output → output actions → versions. Output follows the form; a visible `View result` anchor beside status provides a jump, without rearranging content when status changes. The form CTA remains in normal flow, never under the software keyboard. No horizontal document scrolling; the version strip alone can scroll. At large text/zoom, collapse columns whenever minimum widths cannot fit. Do not fixed-height clip labels or form help.

## Explore

Header: `Make one shot worth keeping.` with a short description and `Open Studio`. Follow with one labeled sample project card and three Amber Study looks: Quiet portrait, Slow approach and Reveal the edge, using the exact editable prompts in the [scope recommendation](../recon/scope-recommendation.md). No empty filter/search controls for a three-card set.

Contact-sheet cards use a 16:10 media area over a solid footer: `01 / STILL`, a concise title, one sentence describing the prompt, and `Use prompt`. Three columns at ≥1200, two at 768–1199, one below 768; gap 20. Each card shows one hero frame and a narrow three-frame contact strip only when three real distinct preview frames exist. Otherwise use a single frame; do not fabricate a sequence. Fine frame numbers and straight alignment provide the film reference without perforation ornament.

Every preview bears `Prepared sample` (or `Illustrative preview` for authored reference artwork). `Use prompt` starts a new saved draft, selects the appropriate task and inserts that exact prompt; it never submits. Retain the prior draft and show `Prompt added to a new draft` with `Return to previous draft`. Presets may specify prose camera direction, never a fictitious native camera/lens field. No promise that generation will match a preview. `Open sample` opens its real stored assets immediately, with no simulated queue.

## Studio

Two task choices: **Create image** and **Animate image**. Use a labeled radio group; both drafts are retained when switching. A selected result remains inspectable even when the form changes.

| Region | Exact behavior |
| --- | --- |
| Create image | Heading `Create an image`; label `Image prompt`; textarea minimum 160px high. CTA `Generate image`. One output and fixed model are facts, not selectors. Reference-image editing is not exposed unless root's capability contract explicitly supports it. |
| Animate image | Heading `Animate a start frame`; reference field `Start frame` with help `Your video begins from this image.` Accept one JPG/PNG; render a contained thumbnail, filename, dimensions and separate `Replace` / `Remove` controls. Label prompt `Describe the movement`; helper `Describe subject movement and camera direction in words.` Fixed facts `5 seconds · [actual model display name]`. CTA `Generate 5-second video`. |
| Upload | Clickable file input plus optional drop surface; identical keyboard path. Show `JPG or PNG · up to [server-defined limit]` using the finalized shared capability. MIME, decoding, size and dimension constraints must agree with the server; the limit is a dependency, not an invented value. Unsupported files get an inline error without removing the previous valid reference. |
| Output | Selected asset title, kind, Sample/Live provenance, actual job status; image or native controlled video; actual dimensions/duration. Show fixed 5s only for the configured request, and actual measured output duration in detail. No automatic playback or preview loop. |
| Output actions | Image: `Animate this image`, `Use prompt`, `Download image`. Video: `Revise this shot`, `Download video`. Download only when a retrievable asset exists. `Animate this image` reuses a compatible owned asset ID; incompatible media retains the source and explains the required conversion, never silently accepts unsupported input. |
| Iterations | Ordered oldest to newest, horizontal strip below the stage: 160-wide cards, 16:9 thumbnail, `V02 · from V01`, status and one-line change summary. Select button changes the inspected asset only; `Revise this shot` explicitly forks its snapshot into a draft. Full prompt/change text remains available in detail. Current version has border plus `Selected`; no color-only distinction. |

First visit has a genuine empty draft and a prominent `Open sample shot` action; do not populate the stage with a sample masquerading as the new draft's output. Shot title defaults to `Untitled shot`; an inline labeled title input allows rename. A secondary `Save draft` button stays available for dirty drafts at zero cap. Save feedback reflects persistence: `Saving…`, `Saved` only after acknowledgement, or `Not saved — keep this page open` with retry. The parent output and original request snapshot are immutable. A revision records parent ID and actual changed prompt/input; show `Same inputs` if unchanged. Prompt-based camera text is part of the prompt difference, never separate provider metadata.

Starting a new shot or using a preset saves the current draft first. On persistence failure, retain it in memory and expose retry; do not silently navigate away. Draft editing may continue during a job, but display `Edits apply to the next version`; lock only submission of another generation while the current request is unresolved. No cancel-job control unless cancellation is actually implemented. Navigating away does not cancel a job.

## Library and asset detail

Library heading `Your shots`; subtitle describes the actual persistence scope root implements (never imply cross-device account sync for a guest cookie). Show shot cards, latest thumbnail, title, version count, most recent actual status and updated time. Three columns ≥1200, two at 768–1199, one below; gap 20. Cards open that shot in Studio. A separate, persistently labeled `Sample collection` prevents prepared media from appearing as the visitor's new output. Empty state: `Your next shot starts here.` / `Open Studio`. No fake favorites, sorting or multi-select.

`View details` on the output opens a right-hand modal dialog: 440 wide on desktop, full width on phone, maximum viewport height with internal content scrolling. Header `Version details` and 44×44 close button; order: provenance/status → preview → parent link/change summary → full prompt → start-frame thumbnail → actual model/duration/dimensions/creation time → download/reuse actions. A parent link selects that parent and closes the dialog; `Back to V02` restores inspection. Do not show secrets, provider raw errors or internal IDs as product copy. Preview/download errors leave metadata and drafts intact. Download feedback says `Preparing download…`, then `Download started` only after a real response; do not claim the browser saved the file. Sample downloads use `Download sample`. Sample details include creator/source and actual creation method; unknown prompt/model stays `Not recorded`. An authored sample's editable text is `Suggested prompt`, never reconstructed generation metadata. Root must supply publicly reusable sample media/provenance; the retained research result is not automatically the shipped sample.

## State treatment

Draft validity/upload state and job state are separate. `disabled` is a capability/budget overlay; `restored` is a recovery notice. Neither overwrites a real queued/running/unknown job. Sample provenance is independent of all states.

| State | Visible treatment and permitted action |
| --- | --- |
| `empty` | Quiet stage, small frame icon, `Start with an image or an idea.` Prompt and upload usable; CTA unavailable with adjacent specific missing-input text. `Open sample shot` works. |
| `uploading` | Preserve existing reference; selected filename and `Uploading start frame…`. Show a percentage only from real byte progress, otherwise activity icon. Submission unavailable; prompt editable. Failed replacement restores prior reference. |
| `ready` | Validated thumbnail/prompt and model facts. CTA enabled only when server capability/budget permits. Before live submission, show authoritative cost/cap information when available; if unavailable, explain the disabled condition. |
| `submitting` | Immediately show `Submitting…` at the CTA and reserve the same width. Snapshot/version pending tile appears; prevent duplicate submit. Do not label accepted until acknowledged. |
| `queued` | `Queued` plus server-confirmed status and last-checked time. Keep source preview, no invented queue rank/ETA/progress bar. |
| `running` | `Creating your shot…`; keep source and snapshot inspectable. Optional elapsed time is elapsed time, not a completion prediction. On polling error say `Status unavailable — last confirmed running`; do not turn it into failed. |
| `submission_unknown` | Amber outlined notice: `We couldn't confirm submission. We're checking before another attempt.` Show `Draft saved` only after storage acknowledgement; otherwise `Keep this page open to retain your edits`. `Check status` reconciles the same request; generation remains unavailable. If automated lookup is impossible, replace the final sentence with `This request needs review before another attempt.` No retry that creates another paid operation. |
| `succeeded` | Show actual output only after it is available; single polite announcement `Version 2 is ready`. Enable inspect/revise/play/download as supported. If saving media is pending, show `Saving result…` and keep download unavailable until retrievable. |
| `failed` | Red icon + `This version couldn't be created.` Safe reason inline. Retain source, prompt, parent and prior versions. Only a confirmed terminal failure offers `Review and retry`; it restores the draft for an explicit new submit and rechecks budget. |
| `disabled` | Persistent `Live generation off` / `Spending is disabled for this workspace.` Disabled CTA remains visible with its reason. Draft editing, valid uploads, real saved-media playback and sample inspection remain usable where configured. No client toggle can enable billing. |
| `restored` | Nonmodal `Draft restored` notice with saved time and parent; restore actual fields, asset availability and job status. Missing reference says `Start frame unavailable — choose it again`; preserve the prompt, block dependent submission. Offline/persistence uncertainty is never called `Saved`. |

Validation errors appear beside their fields with specific repair instructions; retain entered values. Confirmed upload failure offers `Try upload again` and keeps the local selection while available; after reload, unavailable local bytes require reselection. A sample is always `Prepared sample · not generated from this draft` beside the media and in detail. A sample-derived draft says `Based on sample V01`; its future genuine output may say `Live generation`. Any optional simulation must say `Simulated preview` and must never add a live asset or use a realistic success claim.

## Interaction and accessibility contract

Use semantic React components over native elements: `AppShell`, `PresetCard`, `ShotComposer`, `ReferenceField`, `JobNotice`, `OutputStage`, `VersionStrip`, `ShotCard`, `AssetDetailsDialog`. These names are suggested component boundaries, not shared source contracts. Root owns schemas, routing and capabilities.

- Visible skip link to main. Navigation links use `aria-current="page"`; task choices use native radios/fieldset/legend. Real labels, help IDs, `aria-invalid` and error descriptions belong to each field. No placeholder-only labels.
- Tab order follows the responsive reading order above. All actions have ≥44×44 targets, including icon controls; informative tooltips open on hover and focus, dismiss on Escape and never contain the only instruction. Version cards are ordinary buttons in an ordered list, not an invented tab widget; Enter/Space selects and retains focus. Native overflow supports touch and keyboard scrolling.
- Enter inserts a newline in prompts; no single-key submission shortcut. Cmd/Ctrl+Enter submits only with focus inside the composer, a valid draft and live capability; display the shortcut beside an enabled CTA. Never intercept it in a dialog. Native form submit and server request guards prevent duplicates.
- Focus-visible ring is 2px ivory with 3px offset. No focus theft on async completion. Announce status transitions once with a polite live region; omit elapsed-time/poll spam. Use alert semantics only for actionable errors. Route changes focus the page heading; preset/reuse actions focus the newly populated prompt and announce the action.
- Detail is a true modal (`dialog`/`aria-modal`, labeled heading, inert background, trapped focus). Focus close on open, Escape closes, return focus to trigger (or selected output if removed). Background click may close this read-only detail; scrolling/clicking media never does. Unsaved editable form remains outside the detail dialog. No unnecessary confirmation to inspect/reuse; any future destructive deletion needs separate design.
- Immediate press color/highlight starts on pointer-down; activation commits on click/keyboard activation, cancelable by moving off the target. Keep controls interactive during transitions. No hover-only actions, timed toast as sole confirmation, auto-looping backgrounds, mandatory gestures or sound/haptic feedback.
- Respect reduced motion, transparency, contrast and forced colors independently as specified in tokens. Images get useful content descriptions; thumbnails in a labeled selection button may have empty alt to avoid repetition. Native video controls provide play/pause/seek/volume/fullscreen; label the clip and duration. If a future clip contains speech, root must supply accessible captions before claiming that content accessible.

## Integration and verification boundary

Root must bind actual model display name, upload limits, guest persistence scope, durable media availability, cost/cap state and safe error categories into these views. Fixed 5s video and prompt-only camera direction are this task's accepted boundary. Missing backend capability disables the affected action with a precise reason; it does not justify invented settings or results.

Next verification, on the implemented build: laptop 1440×900, intermediate 1024×768, phone 390×844 and 320px reflow; 200% text/zoom; keyboard-only create → inspect → revise; each state above; long prompt/filename; sample versus live distinction; upload failure; reload of unknown and running jobs; focus return; native playback/download; preference overrides. These checks are **not run** here. Coordinator owns phase status, acceptance and final capture verification.
