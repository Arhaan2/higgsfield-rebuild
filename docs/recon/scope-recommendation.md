# Focused scope recommendation

Task `p2-scope-001` · Researcher · 2026-10-12 UTC · Proposal for root Desktop to resolve; no implementation or gate completion claimed.

Build one shot's path through **Explore → Studio → Library**. At zero cap, make preparation, inspection, revision, persistence and download real. Keep real image/video generation a required, blocked delivery milestone. The user's “im allowing it” permits implementation under the documented research exception; R1 gaps and the later V3 real-generation gate remain unresolved. This report neither changes scope nor approves upload terms. [Checkpoint](../RECON.md), [required acceptance](../ACCEPTANCE.md).

## Priorities

The numbers rank work across screens; “must” describes proposed acceptance, not existing functionality. Root owns contracts and architecture.

| Screen | Must | Should, after the musts | Cut from this build |
| --- | --- | --- | --- |
| Studio | **1.** Edit a prompt/reference draft, apply supported choices, validate and save it; restore after reload. Local preview and immediate editing plus server-owned draft/media persistence and validation must work with generation disabled. **2.** Inspect media beside its inputs, duplicate into a linked draft, revise without overwriting the source. Enforce zero cap on the server before any provider call. **Later required:** real uploaded-image → video, then text → image → video, with honest durable jobs and recovery. | Compact changed-fields summary; side-by-side inspection of two existing assets after basic version selection works. | Node/layer/3D editors, motion transfer, lipsync/audio tools, model training, bulk generation, specialist studios and broad model switching. |
| Library | **3.** Save and reopen projects, drafts and assets; expose parent links and immutable result inputs; play actual clips and download actual available files. Validate visitor ownership server-side; distinguish public prepared samples from private drafts. | Rename projects; small image/video/draft filters when enough content justifies them. | Folder administration, collaborative workspaces, public profiles, social publishing and elaborate asset management. |
| Explore | **4.** Three useful presets, preview provenance, “Use preset” → populated Studio draft, and “Open sample” → inspectable prepared project. Preset selection changes the saved prompt, not just card styling. | Task filter only if the collection grows; brief prompt rationale. | Infinite catalog, community feed, contests, courses, subscriptions and external plugins. |

At zero cap, saved drafts are **drafts**, not successful jobs. The server can genuinely validate inputs, persist private records, enforce ownership, serve permitted media and reject generation without a provider call. A browser reload alone is insufficient proof of server persistence: verify retrieval and visitor isolation. Show real save/download errors; retain local edits on failure. Never insert a pretend generation queue or return a prepared clip as a new prompt's output. Infrastructure still needs implementation and verification.

## Evidence → two differentiators

**1. Keep one shot's iteration context together.** IF01/IF02, AS01 and I03 establish an actual image, retained Library asset, image/motion draft reuse and one reload boundary. History and reuse are already present; Canvas comparison is documented, not exercised here. The proposed improvement is a compact parent → revision → next-action view, with the changed prompt/settings next to the media. Its usability advantage remains a hypothesis. [Recorded flows](flows.md), [independent reconciliation](checkpoint-review.md#evidence-reconciliation-and-limits).

Task labels support that continuity: use “Create image” / “Animate image,” show the actual selected model separately, and use “Start frame” only for a verified provider role. I01's preliminary public Soul Cinema/GPT Image 2 mismatch is one recorded state; I03's later populated signed-in view lacked that heading. Do not claim a universal mismatch or imply reference roles are missing: VM01 already exposes them. [I01/I03/VM01](flows.md).

**2. Enforce a hard cost boundary.** C03 already showed a settings-sensitive quote (60 → 35 credits). The IF01 pre-submit warning allowed a 1.125-credit fallback; the coordinator missed it, submitted once, then reported the balance still at 10 without verifying the ledger. IF02's later submission was rejected before a video job. The lesson is enforcement, not inventing cost visibility. At zero cap, reject all live generation before provider submission, including “free” modes with paid fallback. For a later positive cap, root/backend must define reliable estimates, concurrent reservations and uncertain-outcome handling before enabling requests. [Warning chronology](checkpoint-review.md#required-coordinator-corrections), [pre-submit evidence](screenshots/11-influencer-free-before-submit-2026-10-12.jpg).

Applied skill: [`apple-design`](/Users/arhaan/.codex/skills/apple-design/SKILL.md), read for this task. Keep media dominant, controls near their effects, specific task labels and visible save/cost status; preserve agency through duplication. Use readable system typography, keyboard-accessible actions and reduced-motion alternatives. A compact inspector should preserve context; no decorative motion or extra gesture system is necessary. These are proposed design requirements, not rendered checks.

## Presets and exact copy

Proposed collection: **Amber Study**, using the base prompt “Amber glass bottle on dark stone, warm side light.” Each preset appends the appropriate editable text below; the server stores the resulting full prompt. Apply to a fresh draft or offer undo so existing work survives. These are creative instructions, not guaranteed camera behavior or unsupported numeric controls.

| Preset | Create-image prompt addition | Animate-image prompt addition |
| --- | --- | --- |
| Quiet portrait | “Centered composition, eye-level view, soft background.” | “Locked-off camera; a soft reflection moves across the glass.” |
| Slow approach | “Close product framing, shallow depth of field.” | “Slow forward camera push toward the bottle; keep the bottle still.” |
| Reveal the edge | “Three-quarter view, warm rim light defining the silhouette.” | “Slow lateral camera move revealing the bottle's edge; preserve its shape.” |

Do not map these names to invented API camera settings. Only expose ratio, duration or quality once the selected provider's supported values are agreed. Selecting a preset does not alter a prepared sample or imply it was generated from this prompt.

- Persistent sample badge: **“Prepared sample”**.
- Sample detail copy: **“Created before this session. Editing this draft does not regenerate this media.”**
- Sample action: **“Open sample”**; download action: **“Download sample”**.
- Zero-cap banner: **“Live generation is off. Spending limit: $0. You can edit, save and reuse drafts, and inspect prepared samples.”**
- Disabled generation action: **“Generation unavailable”**; nearby explanation: **“A configured provider and a positive approved spending limit are required.”** Keep **“Save draft”** active.
- Saved duplicate feedback, only after persistence succeeds: **“New draft saved. Original unchanged.”**

**Inspect → duplicate → use as reference:** open a sample/asset in the inspector; show provenance, actual available metadata and its parent. “Duplicate draft” copies the stored input snapshot into a new linked draft, not a new result. For a compatible image, “Use as start frame” links the existing asset into an animation draft without re-upload; show its thumbnail and supported role beside the prompt. Incompatible media gets a concrete explanation, not a decorative role selector. Save, reload, return via Library and download the selected original asset; preserve sample provenance on all derived drafts. Unknown sample inputs stay unknown rather than being reconstructed.

## Sample provenance and demo

Prefer one coherent Amber Study project using owned media. The existing [bottle fixture](fixtures/amber-study-upload.png) is an authored geometric PNG, **not AI output**; no corresponding generated bottle clip is evidenced. A separately authored animation could be labeled **“Prepared sample · Authored animation”**, but must not be represented as generated or as a completed provider chain. Do not promise clip playback until a suitable file exists and is verified.

For each shipped sample, record creator/source, reuse permission, actual creation method/date, file/hash, dimensions/duration, and any genuinely known prompt/model/settings. An authored-media project may contain a separate editable **“Suggested prompt”** draft; do not present it as the media's generation history. The [frog WebP](results/free-influencer-frog.webp) is a genuine original-product research result, not a rebuild result: its provenance is IF01, and native original-resolution export remains unverified. Do not assume research retention establishes public redistribution permission. A screenshot or third-party preset preview is not a sample-video license.

**Proposed camera-on walkthrough: 4:30 maximum**, after the shown functionality is verified:

| Time | Action and truthful narration |
| --- | --- |
| 0:00–0:30 | Arhaan on camera; open the public URL. “This is a focused shot-iteration studio. Live generation is currently disabled at a zero spending cap.” |
| 0:30–1:00 | Explore → preset; show exactly which prompt text changes and the visible sample badge. |
| 1:00–1:50 | Studio → edit, save, reload. Explain actual server persistence and the spending boundary using verified behavior. |
| 1:50–2:50 | Open a prepared asset, inspect provenance, duplicate its known draft and change one choice; use a compatible image as a start frame. Show the connected draft, not a new generated result. |
| 2:50–3:40 | Library → reopen saved work, play a licensed/authored prepared clip if available, download the selected sample and verify the file. If no clip exists, show the image and state video playback is unproven. |
| 3:40–4:30 | Explain the two evidence-backed improvements, deliberate cuts and unresolved original-product flows. State that deployed real generation and V3 remain outstanding; finish with repository and limitation links. |

This is an honest interim demo, not full assignment completion. After funded deployed generation passes, root should replace the sample-only result segment with the verified real result and its actual request history; do not stage a fake live wait. Recording must actually exist, include camera, remain below five minutes and be reviewer-accessible.

## Remaining prerequisites and completion boundary

- User must explicitly approve a provider and bounded spending allowance before billable generation; privately configured provider/storage access and working hosting authentication are still dependencies. Zero cap has not changed.
- Original-product upload terms require separate user acceptance/authorization; the implementation exception did not supply it. Root retains live research/browser ownership and the unresolved flow matrix in [RECON](../RECON.md#required-coverage-reconciliation).
- User/coordinator must supply or approve publicly reusable sample media and provenance, then verify local/server behavior and the public deployment. Arhaan must make the actual camera-on recording.
- At zero cap, do **not** mark real uploaded-image → video, standard text/reference image generation, connected generated-image → video, provider submission/retrieval/retry or V3 completed. Prepared playback/download can prove only those prepared-media operations. R1, the native original export and named specialty/external-flow gaps remain open.

No browser, new web research, generation, dependencies, git or deployment was used. Only this recommendation was authored. Current CLI session `01a12db6-330f-7443-8214-d750abd607a3` has its task prompt and `gpt-6-astra` metadata in `.agent-logs/2026-10-12_01-24-38_01a12db6-330f-7443-8214-d750abd607a3.md`; final-response coverage requires root verification after emission.
