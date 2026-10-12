# Phase 1 coverage review

Task: `p1-coverage-review-001` · Reviewer · Accountable coordinator: main Desktop session. Reviewed 2026-10-12 UTC; repository evidence checkpoint at 00:29 UTC, official pages fetched during this session. **R1 remains blocked. This report completes the coverage review, not the product investigation, and authorizes no application implementation.**

Authority reviewed: `AGENTS.md`, `docs/agents/TEAM.md`, `docs/agents/REVIEWER.md`, `docs/PROJECT-BRIEF.md`, `docs/WORKFLOW.md`, `docs/STATUS.md`, `docs/RECON.md`, `docs/SOURCES.md`, `docs/prompts/01-reconnaissance.md`, and `docs/ACCEPTANCE.md`. The assignment is represented by the repository brief; a separate verbatim original assignment was not supplied to this reviewer. Its recorded requirement is signed-in use, flows end to end, and screenshots **before application code**. A focused rebuild does not narrow that investigation.

Method: read repository artifacts, visually inspect six screenshots, and fetch official public pages/help articles without browser UI. No authentication, generation, spending, installation, delegation, external messaging, or application changes occurred in this reviewer session. Both read-only dependencies arrived during review and were read: `docs/recon/flows.md` now records A01/A02/I01/I02/C01/C02/P01; `docs/recon/integration-preflight.md` reports no verified service chain or generation. Later coordinator evidence must be reconciled before any gate decision.

## Existing evidence and its limits

| Evidence | What the artifact supports | What it does not support |
| --- | --- | --- |
| [E1: public home][E1] | Signed-out discovery, promotional cards, navigation, cookie overlay. Repository dates this preliminary capture to 11 October. | Preset execution, playback, account access, or a saved result. |
| [E2: image composer][E2] | Soul Cinema heading alongside GPT Image 2; visible Generate cost and settings. | Submitted job, successful image, upload handling, or retained draft. `authentication_required` is reported in `RECON.md`, not visible in these pixels. |
| [E3: video composer][E3] | Create Video / Edit Video / Motion Control, References / Extend Video, model/settings, History affordance and visible cost. | History contents, reference semantics, accepted job, playback or download. Its reported authentication error likewise comes from `RECON.md`. |
| [E4: authentication boundary][E4] | Welcome/sign-up modal with provider/email choices; cookie panel covers part of the form. Coordinator identifies this as 12 October UTC. | Completed signup, sign-in, onboarding, credit entitlement, or any downstream success. |
| [E5: coordinator-labeled signed-in home][E5] | Later mobile home with Library/Profile navigation and promotional/free labels. | The screenshot alone does not establish the authentication steps, account balance, trial entitlement or a completed generation. Do not repeat the earlier sign-in request without checking the coordinator's current session. |
| [E6: Cinema mobile boundary][E6] | Coordinator-named Cinema capture explicitly says this feature is available on desktop only. | Desktop availability/result, or a successful Cinema workflow. The exact route and viewport belong in the coordinator's flow record. |

The arriving inventory supersedes the signed-out handoff: **A01 records completed sign-in**, based on user confirmation and coordinator observation, while onboarding is only observed. C01 records that a 1440×1000 desktop tab resolved E6's restriction; its desktop screenshot is pending. This reviewer read those records but did not repeat the interactions. No artifact establishes a completed creation/result chain. Exact capture times are not independently recoverable from the images; add actual per-flow UTC times rather than inventing them. The inventory records that the user chose to keep spending disabled; allowance remains zero.

Status vocabulary: `completed` requires an observed end-to-end outcome; `observed` means a visible state only; `blocked` identifies an actual stopping dependency; `documentation_only` means official published descriptions, including public page text. **Every official-source finding below is `documentation_only`.** An HTML shell with Login/Sign up is not evidence that an individual route was attempted or that its backend failed.

## Coverage matrix

The [fetched navigation][home] corroborates all coordinator-listed families and additionally exposes **ChatGPT Plugin**. Rows group related tasks for readability; each distinct branch discovered in use needs its own `flows.md` entry. A shared result can substantiate several linked steps when the record shows that connection. This is not a demand to generate with every model or every preset; do not assume two routes are equivalent without evidence.

For each generation branch below, “result chain” means: actual inputs and settings → visible pre-submit cost → submitted job and status → terminal result → inspect/play → retrieve the correct file. Record a stable job/asset reference, dated screenshots and outcome notes without exposing account secrets. A screenshot of Generate or an accepted request is insufficient.

| ID / required family | Official basis (`documentation_only`) | Existing interaction evidence | Evidence still needed for R1 |
| --- | --- | --- | --- |
| F01 · Signup, sign-in, onboarding | [Account entry guide][auth] | A01: `completed` sign-in per coordinator/user confirmation; `observed` onboarding; E4/E5. | Record signup versus existing-account sign-in and unobserved onboarding steps explicitly. Do not repeat authentication already completed or count sign-in alone as the assignment's signup step. |
| F02 · Explore, discovery, presets/recreate | [Home][home], [first generation][first], [Academy prompt bank][academy] | A02/E1/E5: `observed` discovery only. | Open an item, preview it, follow its use/recreate action, verify carried prompt/settings/references, and connect to a result chain. Distinguish sample preview from newly generated output. |
| F03 · Image: text and reference creation, model/settings changes | [Creation guide][first] | I01: authenticated composer `observed`, output `blocked` by budget; I02 signed-in references pending; E2 preliminary. | Complete text-to-image and reference-based branches when authorized; record upload preview/validation, supported choices and model-change behavior; inspect/download/reuse outputs. |
| F04 · Video: text-to-video and image-to-video | [Creation guide][first], [reference behavior][canvas] | E3: public composer `observed`; signed-in standard-video branches pending. | Both input branches, reference roles, model/settings/cost, result chain; carry a generated image into video and verify the actual input survived the handoff. |
| F05 · Video: Edit Video, Motion Control, Extend Video | E3 affordances; [Cinema modes][cinema], [motion-reference guidance][influencer-help] | `observed`: labels only; execution unverified. | Separate source-video edit, motion-reference and extension records where available. Show input roles, intended change and original/result playback; do not substitute ordinary image-to-video. |
| F06 · Audio | [Audio modes guide][audio] documents speech, voice change and translation. | `documentation_only`; [Audio fetch][audio-entry] returned shell. | Inventory current modes; supply appropriate text/audio, inspect choices, result playback/download for distinct branches. Record custom-voice setup separately if exposed; suitable authorized sample input remains a dependency. |
| F07 · Lipsync / talking clips under Video | [Lipsync guide][audio] distinguishes image/video inputs from native audio generation. | `documentation_only`. | Character image/video + speech → synchronized talking result; note distinct input modes and handoff from Audio. Native video sound alone does not complete this flow. |
| F08 · Edit: Layers and image/video utilities | [Edit entry][layers] resolves to Layers; [Assets][assets] lists image edits; [audio/ratio guide][audio] describes Reframe and Expand. | `documentation_only`; no tool results. | Expand actual menu: Layers, inpaint, upscale/enhance, relight/color/angles, expand/reframe and any other exposed utility. Record each distinct input/change/output; verify edited/exported result, not merely editor opening. |
| F09 · Effects | [Effects entry][effects] fetch confirms route only. | `documentation_only`; exact controls unknown. | Inventory current effect families, choose a preset, observe required media/configuration and result chain. Cross-reference F02 only if the same flow is demonstrated. |
| F10 · Cinema Studio | [Cinema guide][cinema] describes versions, scene/camera control, Elements and directing. | C01/C02: desktop v4 controls and empty-prompt validation `observed`; E6 mobile boundary resolved on desktop; output `blocked` by budget. | Attach desktop screenshot; exercise actual scene/reference setup, camera choice, result chain and saved/reused Element. Inventory distinct version/mode branches; control options alone do not prove generated semantics. |
| F11 · AI Influencer and Soul ID | [October update][influencer] describes builder → paired portraits → Genjutsu/Cinema reuse; [Soul ID][soul] describes a separate training workflow. | `documentation_only`. | Builder choices → actual portrait/full-body result → parameter inspection, recreate/download and video handoff. Inventory Soul ID training separately; authorized photo set, access and spend are unresolved. A saved Element is not proof of completed training. |
| F12 · Genjutsu | [Guide][genjutsu] distinguishes Motion Transfer and Object Swap; [changelog][changes] adds Restyle. | `documentation_only`; generator shell fetched. | Source video + references → each distinct mode's result; compare source motion/targeted change, playback/export. Capture current input limits rather than copying API limits into web findings. |
| F13 · Katana | [8 October changelog][changes]: preset/reference workflow ending in Recreate in Claude. | `documentation_only`; [Katana][katana] fetch returned shell. | Preset → references → real external handoff and returned edit. Claude/MCP access and credit allowance are unresolved; a copied prompt or outbound link is not execution. |
| F14 · Ads Studio, including Ad Multiplier | [Ads Studio][ads] describes website/brand/product setup; [6 October changelog][changes] adds a reference-video Ad Multiplier path. | `documentation_only`; [Ad Multiplier][ad-multiplier] shell fetched. | Record brand extraction/review → product selection → generated ad; separately reference ad + replacements → video variation. Validate manual correction/fallback where exposed. Do not collapse this into Marketing Studio. |
| F15 · Marketing Studio | [Guide][marketing]: template/product path, prompt path, image/video categories and Posters editing. | `documentation_only`. | Product URL/image → configured template → result; inventory prompt route and materially distinct output/edit branches. Follow a usable output through inspect/revise/download. Publishing ads is not authorized by research alone. |
| F16 · Canvas | [Guide][canvas]: connected nodes, reference rules, comparison, templates, autosave/collaboration. | `documentation_only`. | Build/connect a workflow, execute nodes within allowance, verify output handoff/comparison, save/reopen template/board. Sharing controls may be inspected; collaboration is unverified without an authorized second participant. |
| F17 · Supercomputer | [Guide][supercomputer]: brief → agent plan/steps → results, refinement; Apps/Games/Skills/Connectors also listed. | `documentation_only`. | Inventory workspace branches, run a bounded authorized task, inspect step costs/results, refine and reopen. Apps/Games, scheduling and external actions remain separately unresolved where distinct; no unattended or external action is authorized by this report. |
| F18 · 3D Jutsu | [Guide][jutsu]: editable scene, camera/timeline, revisions and export/video path. | `documentation_only`; [entry][jutsu-entry] shell fetched. | Prompt/reference → scene; edit an object/camera; restore a revision; inspect real export and scene-to-video result. Documentation calling Auto free does not verify this account's entitlement or authorize paid rendering. |
| F19 · MCP/API and ChatGPT Plugin | [MCP][mcp], [API][api], [ChatGPT entry][chatgpt] describe distinct access routes. | `documentation_only`; API navigation redirected to Open Higgsfield. | Inspect authorization/setup boundary and available operations; record actual output/Assets retrieval for any authorized execution. Separate website credits from API account/dollar billing. No connector authorization, key creation or funded API account was verified. |
| F20 · Plugins | [Integrations guide][integrations], [plugin landing page][plugins] | `documentation_only`. | Inventory hosts and setup prerequisites; prove host connection → operation → inserted output for required distinct integration flows, or name the unavailable host/access explicitly. Installing software is outside this review. Landing-page instructions are not a working plugin. |
| F21 · Academy | [Academy][academy]: courses and prompt-bank actions. | `documentation_only`. | Open lesson, verify media/navigation and prompt copy/recreate destination. Document sign-in or progress persistence if offered; completing every course is not established as a requirement. |
| F22 · Community | [Community][community], [public profile behavior][assets] | `documentation_only`. | Browse project/creator detail and playback; inspect publish/share/private boundary. Social writes, comments or invitations require separate authority; their outcomes remain unverified. |
| F23 · Contests | [Current festival page][contests] exposes rules/timeline/submissions/voting. | `documentation_only`. | Inspect rules, entry and eligibility boundaries, submission preview and film playback. Current voting/closed-entry status must be recorded. No vote or public contest submission is authorized here; unresolved participation needs a specific decision. |
| F24 · Originals | [Originals][originals]: series/watch and film discovery. | `documentation_only`. | Open title → actual player → playback/navigation and any creation handoff. An HTML “browser does not support video” fallback is not a tested playback failure. |
| F25 · Assets/history/projects/reuse/download | [Account and Assets][assets] | P01: empty project/folder creation `observed`, reload verification pending; E3 History affordance. | Attach project evidence and finish reload check; find real output, inspect inputs/model, organize/favorite, recreate/reference/turn to video, confirm original retained and correct download opens. Inspect public/private boundary without publishing by default. |
| F26 · Account/settings/pricing/credits | [Account][assets], [credits][credits], [API distinction][api] | `observed`: E2/E3 and I01/C01 Generate prices; account contents unverified. | Account balance, plan restrictions, settings/usage and changed-setting cost; inspect plan/checkout boundary without charging. For authorized generation, reconcile charge/refund with actual outcome. Website and API budgets are separate dependencies. |
| F27 · Empty/loading/error/recovery across flows | [Lifecycle guide][failure] describes queued/processing/generating and stage-dependent cancellation. | `observed`: empty composers, C02 `prompt_required`; earlier auth boundary. | Record real pending/result states and any naturally encountered failure/recovery, including draft retention/reload. Safely inspect validation. Do not spend credits to force failures or label a documented refund as observed. Untested cancellation/refund stays unverified. |

Additional branches must be expanded when found, including the specialist studios linked in the [official tools index][tools] (for example Photodump, Fashion Factory and Popcorn), Apps/Games and character tools. They are discovery dependencies, not silently covered by a generic “specialist studios” tick. The fetched index establishes links, not present-day availability or completed use.

## Findings that affect claims and scope

**Blocking — missing creation outcome evidence.** A01 resolves sign-in and C01 reports desktop access, but no generated result, populated asset library, download, reload or reuse outcome is available. P01's returned project/folder IDs support creation only; persistence is still pending. A filled coverage matrix cannot pass R1. The user's reaffirmed zero allowance blocks billable completion; it is not permission to use another paid route.

**Important — avoid false differentiation.** The following capabilities already have official support:

| Hypothesis | Existing evidence | Defensible next investigation |
| --- | --- | --- |
| “No history/projects/reuse” | [Assets guide][assets]: saved media, folders, metadata, recreate/reference/turn-to-video; E3 also exposes History. | Compare how clearly the current task shows related attempts and their changed inputs. No absence claim is supported. |
| “No upfront cost” | [Credits guide][credits] and E2/E3 show Generate costs; documented Usage tracks charges. | Observe whether changing model/settings keeps cost understandable and whether recovery explains charges. Do not claim hidden cost from these screenshots. |
| “No comparison” | [Canvas guide][canvas] documents parallel outputs and side-by-side comparison. | Investigate whether a focused single-shot iteration view reduces navigation; that remains a hypothesis, not a unique capability. |
| “Reference roles are unclear” | [Canvas guide][canvas] already differentiates Kling start frames/Elements and Seedance prompt-described references. | Observe in-context guidance during upload/model change; offer only provider-supported semantics in the rebuild. Documentation complexity suggests a question, not a proven defect. |
| Task/model copy alignment | E2 directly shows Soul Cinema heading with GPT Image 2 selected. | Reproduce signed in, switch models and inspect guidance. This supports one specific mismatch, not a product-wide usability conclusion. |

Applied the installed `apple-design` skill at `/Users/arhaan/.codex/skills/apple-design/SKILL.md`: use predictable labels/wayfinding, control-to-content relationships, visible status and recoverability as review criteria. E4's overlapping cookie panel and E2's heading mismatch are concrete states worth revisiting; E6 establishes a mobile access limitation for that captured route. No interactive keyboard, mobile, motion, contrast or measured usability test was performed; do not turn these principles into unobserved defects.

**Important — reconcile current product with dated documentation.** The [August AI Influencer help page][influencer-help] describes a species-based builder; the [October update][influencer] explicitly replaces that structure and adds a paired-image/Genjutsu workflow. [Edit's live entry][layers] resolves to Layers, while the [ratio guide][audio] gives Edit → Reframe. [Plugin landing][plugins] and [integration help][integrations] differ on Adobe version/installer prerequisites. Record actual routing/controls rather than resolving these differences by assumption. Pricing promotions/free trials and plan-specific access are likewise unverified for the user's account.

Implementation scope remains the brief's focused Explore → image/reference → video → inspect/revise → Library/download journey. Broad model parity, specialist studios, a node editor, social features, full billing and external plugins can remain outside the initial **build** as the brief proposes. Their investigation obligations remain visible above. Provider/API feasibility belongs to the backend preflight; successful API documentation retrieval does not satisfy original-product research or deployed-generation acceptance.

## Evidence needed to advance R1

1. Coordinator expands `flows.md` from its seven current entries against every matrix family and distinct branch. Add actual per-flow UTC times, unambiguous entry URLs and keep/improve/omit rationale; attach pending desktop/project screenshots and P01 reload results. Each entry needs inputs/choices, steps, result or exact stopping point, state/recovery and next action. Link shared evidence instead of repeating paid runs solely for screenshots.
2. Preserve A01's completed sign-in and C01's desktop resolution. Record signup/onboarding separately from reuse of an existing account, including which user-operated steps were not observed. Inspect entitlements and pre-submit costs without spending; an advertised free allowance is not an observed balance.
3. For operations that consume credits, obtain explicit authorization naming the original-product allowance, credit/dollar cap, and permitted flows. A later rebuild-provider cap is separate. Keep both at zero until authorized. No top-up, subscription, API charge or automatic refill is implied by repository authorization.
4. Complete the required distinct creation/edit/specialty result chains and linked history/reuse/download/reload evidence. For passive surfaces, demonstrate the actual browse/play/handoff goal; for billing inspect the permitted checkout boundary. Preserve blocked/unverified actions instead of manufacturing success. Record real failures if encountered; do not require deliberate paid failures.
5. If breadth is infeasible, coordinator asks Arhaan to decide the **specific remaining scope**: provide the needed product/host/external-account access and bounded credits, or explicitly amend which named rows/branches may remain unverified (especially signup on an existing account, paid specialty workflows, plugin/MCP execution, collaboration and public participation). Record the decision and its assignment impact. This review grants no exception and does not call a boundary-only inspection an end-to-end success.
6. Root reconciles the inventory, this review and backend preflight; updates RECON/STATUS/SOURCES/decisions from actual evidence, then determines R1. The currently read STATUS checkpoint predates this delegated task; SOURCES still describes Apple skill resolution as pending. Correct these checkpoints without rewriting preliminary provenance or raw capture.

## Capture and verification handoff

Observed CLI session: `01a12d7c-4adb-7581-9f20-15cd84960115` (`CODEX_THREAD_ID`). Its native log exists at `.agent-logs/2026-10-12_00-21-23_01a12d7c-4adb-7581-9f20-15cd84960115.md`, with the delegated prompt and model `gpt-6-astra`. The cited CLI canary file contains both its full task prompt and final YAML. Root's canary verification is accepted as supplied; this reviewer did not rerun the capture verifier or edit logs. **This session's final response cannot be verified until emitted; coordinator must compare and commit it afterward.** Native children/worktrees remain outside this verified route and were not used.

Actual checks: read required instructions/brief/evidence and arriving flow inventory/backend preflight; inspect E1–E6 visually; independently fetch official navigation and cited documentation; cross-map all seven current flow entries and reconcile advertised capabilities against differentiation hypotheses. A read-only script found 27 unique flow rows, all supplied navigation names, no undefined reference links, and existing local screenshot targets; it also confirmed the entire delegated handoff text is present in this session's prompt log, with zero response entries before final emission. No application tests or product execution checks were run. Report completion must not be confused with an R1 pass.

[E1]: screenshots/01-home-signed-out.jpg
[E2]: screenshots/02-image-composer-signed-out.jpg
[E3]: screenshots/03-video-composer-signed-out.jpg
[E4]: screenshots/04-sign-in-required-2026-10-12.jpg
[E5]: screenshots/05-home-signed-in-2026-10-12.jpg
[E6]: screenshots/06-cinema-mobile-boundary-2026-10-12.jpg
[home]: https://higgsfield.ai/
[auth]: https://higgsfield.ai/creator-hub/help-center/getting-started/create-an-account-and-sign-in
[first]: https://higgsfield.ai/creator-hub/help-center/getting-started/how-do-i-create-my-first-generation
[assets]: https://higgsfield.ai/creator-hub/help-center/getting-started/whats-in-my-higgsfield-account
[credits]: https://higgsfield.ai/creator-hub/help-center/credits/how-credits-work
[canvas]: https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-canvas
[cinema]: https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-cinema-studio
[marketing]: https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-marketing-studio-to-create-video-ads
[supercomputer]: https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-supercomputer
[influencer-help]: https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-ai-influencer
[influencer]: https://higgsfield.ai/blog/new-ai-influencer
[soul]: https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-create-and-use-a-soul-id-character
[genjutsu]: https://higgsfield.ai/blog/higgsfield-genjutsu
[changes]: https://higgsfield.ai/creator-hub/changelog
[katana]: https://higgsfield.ai/katana
[ads]: https://higgsfield.ai/ads-studio
[ad-multiplier]: https://higgsfield.ai/ads-studio/ad-multiplier
[jutsu]: https://higgsfield.ai/blog/higgsfield-3d-jutsu
[jutsu-entry]: https://higgsfield.ai/3d-jutsu
[audio]: https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-lipsync-voiceover-and-aspect-ratios
[audio-entry]: https://higgsfield.ai/audio
[layers]: https://higgsfield.ai/layers
[effects]: https://higgsfield.ai/effects/use
[mcp]: https://higgsfield.ai/creator-hub/help-center/integrations/what-is-higgsfield-mcp
[api]: https://higgsfield.ai/creator-hub/help-center/integrations/what-is-the-higgsfield-api
[chatgpt]: https://higgsfield.ai/mcp?tab=chatgpt
[integrations]: https://higgsfield.ai/creator-hub/help-center/integrations/external-integrations-higgsfield
[plugins]: https://higgsfield.ai/plugins/after-effects
[academy]: https://higgsfield.ai/academy
[community]: https://higgsfield.ai/community
[contests]: https://higgsfield.ai/contests/higgsfield-global-film-festival
[originals]: https://higgsfield.ai/original-series
[failure]: https://higgsfield.ai/creator-hub/help-center/troubleshooting/generation-is-stuck-or-failed
[tools]: https://higgsfield.ai/creator-hub/help-center/tools
