# Rendered Studio review

Task `p3-rendered-design-review-001` · Designer · accountable coordinator `root` · 2026-10-12 UTC.

**Outcome:** retain the accepted direction. Two visible defects need small repairs: duplicate upload controls/state copy and an unconstrained portrait version thumbnail. The form is unnecessarily tall; compact its existing groups without changing the accepted form → result → versions order. No redesign or release acceptance is implied.

## Evidence and boundary

Read with `view_image`:

- [02-local-studio-desktop.jpg](02-local-studio-desktop.jpg): root's 1440×900 browser capture; actual full-page image 1440×1734.
- [03-local-studio-mobile.jpg](03-local-studio-mobile.jpg): root's 390×844 browser capture; actual full-page image 390×2779.

Both depict the restored **Dune study — first direction** draft, Animate image selected, an uploaded portrait reference, and generation disabled. Root reports a 390px document width at 390px; this reviewer did not independently measure the document. Screenshot 01 was excluded as obsolete. No Explore, Library, dialog, sample-selected, error, pending, video-playing or other-width render was supplied or inferred.

Read `AGENTS.md`, `docs/agents/TEAM.md`, `docs/agents/DESIGNER.md`, `docs/DESIGN-BRIEF.md`, `docs/design/direction.md`, `tokens.md`, `component-contract.md`, current Studio components and `styles/studio.css`. Read the actual installed **apple-design** skill at `/Users/arhaan/.codex/skills/apple-design/SKILL.md`; applied §15 scalable system typography, §16 hierarchy/proximity and meaningful controls, §1 immediate feedback, and §14 independent preference handling. No external references were needed for this artifact review.

Capture checked in the real repository destination: `.agent-logs/2026-10-12_02-15-36_01a12de4-dc13-74d3-96f9-905af65ed436.md`. Its header and prompt identify model `gpt-6-astra`, session `01a12de4-dc13-74d3-96f9-905af65ed436`, and the full assigned task. Prompt coverage is observed; final-response coverage remains unresolved until root checks after emission. No capture files were edited. C0/D2 are coordinator-provided verified gates; the research exception permits this review while R1 gaps remain. No provider request or spending occurred.

## Definite visible defects

**R01 · P2 · Competing reference selectors and misleading empty state.** Both images show a retained thumbnail, filename and dimensions, then native **Choose File / No file chosen**, then **Replace / Remove**. “No file chosen” is true only of the cleared input, but visually contradicts the retained start frame. Two controls open the same picker and occupy separate rows. Source: `components/studio/StudioView.tsx:59–61`; line 60 clears the native input after selection.

Minimal repair: retain the visible native input for the empty state. With a reference present, hide that input from display/tab order and expose exactly one ordinary **Replace** button that calls the existing input ref, alongside **Remove**. Associate the visible reference label/help with the replacement control; keep upload errors/status visible and described. Do not try to populate a native file input with a persisted filename. Root should check keyboard activation, successful replacement and failed replacement retaining the previous reference.

**R02 · P2 · Version thumbnail defeats the specified geometry.** In both screenshots the selected reference tile contains a tall portrait image, not the accepted 16:9 thumbnail well. On desktop the image is approximately 140×210, followed by captions; the whole tile is about 284px tall. This makes one reference visually heavy and would produce inconsistent scan heights with mixed media. Source: `styles/studio.css:219–220`, with the nested image in `components/studio/StudioView.tsx:79`. `aspect-ratio` on the wrapper does not currently constrain the intrinsic child as intended.

Minimal repair: make `.version-thumbnail` a positioned, nonshrinking 16:9 box (`position:relative; flex:none; min-block-size:0`) and position its image/video child absolutely with `inset:0; inline-size:100%; block-size:100%; object-fit:contain`. Keep the existing dark well and reserve the outer selection border; do not crop portrait assets. Root should recapture this portrait and check a landscape/video poster in the same strip. The main output stage already contains the portrait correctly and should retain its current treatment.

## Source-confirmed interaction defect; state not rendered

**R03 · P2 · Replace can appear available while its picker is disabled.** `StudioView.tsx:60` disables the native input for uploading, expired session or conflict; the Replace button at line 61 is disabled only for uploading. In the other two conditions activation targets a disabled input and has no useful result. Apply the same unavailable expression to Replace and keep the existing session/conflict explanation available. This is a static control-state mismatch; no expired/conflict interaction was run. Review Remove separately according to whether local reference removal remains supported—do not disable it merely for symmetry.

## Focused improvements, not acceptance-blocking visual defects

**I01 · P2 recommendation · Bring the prompt closer to the task.** On desktop the movement label starts around document y=1020, below the 900px viewport; the generation and save area is still farther down. On mobile the prompt is also below the first 844px. The composer fills most of a 2779px document before the result. Scrolling itself is expected, but this form spends excessive height on a populated upload and separated explanatory text.

Apply R01 first. Then group the task fieldset and its helper at `StudioView.tsx:56` inside a `.field-group`, so the helper receives the existing 8px group gap instead of being a separate composer child with a 24px gap (`studio.css:163,166`). Give `.reference-preview` a full-width two-column grid (`5rem minmax(0,1fr)`) at `studio.css:190` so the existing 80×60 thumbnail and filename/dimensions sit beside each other; wrap only when genuinely necessary. Keep Replace/Remove in one row and avoid an empty-state height requirement for a populated reference. Hide the empty `#upload-status` box when it has no message while preserving a suitable status region for actual updates. Retain 16px prompt type, 44px targets and normal document scrolling. Reassess after these small repairs before shrinking page/header spacing or changing the accepted layout.

**I02 · P3 copy refinement · Name the inspected content accurately.** The stage says **SELECTED OUTPUT** above a **Your upload** badge, and the jump says **View result** when only an uploaded input exists (`StudioView.tsx:68,75`). The upload badge prevents a definite generated-result claim, but the larger framing is less precise. Use **Selected reference** and **View reference** for an upload, keep result wording for generated media, and preserve the existing prepared-collection wording for samples. The accepted task heading, movement label, Kling facts and 5-second CTA otherwise agree in the supplied state.

## What holds up and what root must still verify

The charcoal/ivory/brass hierarchy is coherent. Labels and prompt text are readable at the supplied scale; model facts and disabled-generation reason remain legible. The portrait's proportions are preserved in both main stages. Main output actions remain visible without hover. Selection has both a border and “Selected” text. Current source includes the repaired `notice-error`/`notice-warning` variants and real `ol > li > button` version structure (`StudioView.tsx:74,79–80`); the earlier reports about those omissions are not current findings.

The mobile capture shows the fixed nav crossing the start-frame area at the original viewport edge. A full-page screenshot composites fixed chrome there; this is **not evidence of permanently unreachable content**. `studio.css:274,278,281` supplies fixed-bottom positioning, scroll padding and 6rem plus safe-area end padding. Root still needs to scroll to the end and tab/shift-tab through lower controls, check the View result/reference jump, and inspect software-keyboard and increased-text clearance. No fixed-nav repair is justified from this image alone.

Static source has focus-visible outlines (`studio.css:70`), persistent actions, immediate active styling, preference overrides, and a native modal with autofocus/return code (`AssetDetails.tsx:17–24`). These are implementation observations, not keyboard, screen-reader, contrast or accessibility passes. Sample disclaimers exist in current markup (`StudioView.tsx:76,80`; `AssetDetails.tsx:26–27`), but neither screenshot validates their rendered presentation. Root owns fresh screenshots after repairs, additional widths/zoom, focus/interaction checks, playback/download and error/reload verification. This review changes only this document and does not advance a project gate.
