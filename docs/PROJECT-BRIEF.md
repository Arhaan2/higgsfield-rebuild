# Project brief

## Mission

Build a publicly accessible, well-designed reconstruction of Higgsfield's central creative experience for Arhaan Aggarwal's 8x software-engineering assignment. A reviewer should understand the user task immediately, complete a meaningful workflow, and see why the product choices were made. Deliver a public repository with authentic incremental agent logs and a real camera-on walkthrough under five minutes.

The user has approved this direction and asked for Codex to run the work with well-defined subagents. This is a timed product-engineering exercise. The goal is a small, convincing working product whose behavior matches its presentation. Completing the central task and explaining its tradeoffs matters more than maximizing route count.

## Authoritative requirements and deadline

The user-supplied brief requires using the live original, signing up, following its flows end to end, and taking screenshots before writing application code. It separately requires the official agent-capture setup and successful capture verification before building. It asks for a live open deployment, public source repository containing .agent-logs/, and a camera-on walkthrough no longer than five minutes. It judges speed, product judgment, and UX/UI. It explicitly discourages a thoughtless one-to-one interface copy.

Deadline: 2026-10-12T23:04:00Z, equivalent to Monday 12 October at 4:04 p.m. Pacific. Work toward being ready by 2:00 p.m. Pacific. These are project dates, not proof that a build has happened. Recompute remaining time when work resumes.

Sources: the user's brief in this conversation; [original product](https://higgsfield.ai/); [mandatory capture guide](https://8x-internal.com/p/8x-agent-capture-setup).

## Primary user and outcome

Design for an individual creator making one compelling cinematic shot: a product clip, a stylized scene, or a short creative concept. They have either a rough idea or a starting image. They need to understand what input is required, make a few meaningful choices, get a result, and iterate without losing context.

The intended end-to-end story is:

1. Discover a relevant preset or open the studio with a clear starting action.
2. Upload a starting image, or create one from a prompt.
3. Understand how the reference will be used and choose only supported settings.
4. Submit the operation and see an honest pending state.
5. Inspect the completed image/video and its actual inputs and settings.
6. Carry an image into animation without uploading it again.
7. Make a variation while preserving earlier work.
8. Find the project again after reload and download the preferred file.

Use one coherent, visually strong sample project for the walkthrough. Previously prepared media must be labeled as a sample; it cannot masquerade as the output of a new prompt.

## Product structure

**Explore:** a compact, curated preset collection with useful previews, filtering when it helps, and working actions that populate the studio.

**Studio:** a focused creation workspace joining references, prompts, settings, job status, results, and the next action. Make model-specific behavior visible where it affects a decision.

**Library:** saved assets/projects with viewing or playback, generation metadata, reuse, and working download. Keep each visitor's private work separate.

An asset detail panel belongs to these workflows; it does not require an elaborate separate application. A lightweight project and version model is enough.

## What to build first

Prove upload-to-video early: a real input image must lead to a real submitted job, a retrieved result, playable video, and download on the public deployment. Then add prompt-to-image and the image-to-video handoff. This order exposes provider, upload, persistence, and hosting failures before the interface becomes broad.

A strong final scope includes both image and video creation with a deliberately small supported model set. If a real dependency forces a narrower scope, record the impact and obtain a user decision where necessary; do not silently mark the original target complete.

Required behavior includes valid uploads, controls wired to requests, protected duplicate submission, recoverable errors, preservation of drafts, persistence across the promised reload/session boundary, usable output files, and a clear sample/live distinction.

## Differentiation to investigate and implement

The selected direction is task-focused creation, explicit reference semantics, and clearer relationships between iterations. These are hypotheses to validate during the signed-in audit.

For example, label a supported reference as "Start frame" and explain that the video begins from it. Expose additional reference roles only when the chosen provider actually supports their meaning. Explain a compatibility change before submission. A decorative role selector with no real backend interpretation would be misleading.

Keep titles, guidance, selected models, and primary actions aligned with the current task. The preliminary image screenshot showed a Soul Cinema heading while GPT Image 2 was selected; record this as one observed public state, not as a universal defect or measured usability result.

Group related attempts under a project and retain their inputs. A version strip may explain a changed prompt or setting. Do not advertise history, credit visibility, prompt reuse, or model comparison as invented capabilities: official Higgsfield documentation already describes them. The improvement is the clarity and focus of the chosen experience.

## Design instruction from the user

The user has installed an Apple Design skill in their local Codex environment. The design specialist must discover and read its actual instructions before producing the accepted design direction, record the resolved path/name, and apply relevant guidance. This kit does not contain that skill or claim to know its contents.

Preserve a cinematic, media-led identity. Proposed goals from this project include clear hierarchy, consistent typography and spacing, restrained accents, obvious affordances, accessible controls, responsive layouts, and motion that communicates state. These goals are our brief, not quotations from the unseen skill. Choose a distinctive final visual system in Phase 2; avoid repeated redesign after implementation starts.

## Intentional scope boundaries

Investigate the original broadly enough to satisfy the research requirement, then choose implementation depth. A complete billing system, team collaboration, full social network, node editor, extensive account administration, every specialty studio, and broad model parity are outside the initial build. Avoid adding empty navigation destinations for omitted functionality.

Use documented generation APIs and existing accessible infrastructure. Do not reverse-engineer private original-product endpoints or present the original site as your application. Do not build model-training infrastructure for this task.

## Engineering judgment

Choose one familiar full-stack TypeScript/React application, one hosting path, and the minimum durable data/media services. Confirm current APIs and supported capabilities in the environment where the work runs. Root owns the stack decision; specialized agents propose rather than independently installing conflicting frameworks.

Treat jobs as persistent operations: a network timeout does not prove the provider rejected a request. Reconcile an uncertain submission before retrying paid work. Preserve source inputs and actual request settings. Confirm the provider's idempotency/retrieval behavior instead of inventing guarantees.

A public guest evaluation path must be useful and bounded. A sample project can make immediate inspection possible. Apply real server-side ownership and usage limits to live operations. Do not imply the public visitor's browser is a trusted authority for costs, asset access, or job status.

## How the work should run

The main Codex thread is accountable for integration and delivery. Use up to three specialists at a time, based on available concurrency. Give each a bounded goal, exclusive writable paths, agreed interfaces, acceptance evidence, and a clear handoff. Prove capture for the actual delegation route before production delegation. Keep one owner for each authenticated browser session.

Continue across ordinary completed gates without asking for approval again. Stop the dependent action only when a real prerequisite is missing: authentication, required spending authority, capture support, required research access, or the actual design skill. State exactly what is missing and continue independent authorized work.

## Definition of success

A fresh evaluator opens the public link, understands the starting point, can inspect a clearly labeled sample immediately, and can exercise the working creation path within documented limits. At least one real image-to-video generation completes in the deployed environment. The final target also includes image creation and a connected iteration loop. Errors are understandable; the app preserves work; downloads function; the core layout works on desktop and phone.

The public repository explains the observed problem, choices, architecture, setup, actual tests, omissions, and provenance. Required capture evidence is real and incremental. Arhaan records an accessible camera-on walkthrough below five minutes. No file or status is marked passed on the strength of a plan, mock, or a teammate's unsupported assertion.
