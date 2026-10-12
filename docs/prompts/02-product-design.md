# Phase 2 — Set scope, apply Apple Design, and agree the contracts

Act as the lead coordinator. Convert the verified research into a small product with a complete creative loop: Explore → Studio → Library, starting with uploaded image → real video → playback/download, then adding prompt-to-image and connected iterations. We are demonstrating product judgment and engineering execution, so every visible control must serve a supported behavior.

Read AGENTS.md, docs/PROJECT-BRIEF.md, docs/RECON.md, docs/DECISIONS.md, docs/DESIGN-BRIEF.md, docs/TECH-SPEC.md, docs/ACCEPTANCE.md, docs/STATUS.md, and docs/agents/TEAM.md. Confirm the capture and signed-in research gates. All starting specifications are proposals until resolved here.

## Parallel decision work

- Designer: read docs/agents/DESIGNER.md and the actual installed Apple Design skill plus its required references. Own docs/design/**. Produce a coherent visual direction, screen/state specification and tokens proposal grounded in the research and real skill. Record its exact locator and applied guidance. Do not invent skill instructions. If unavailable, report the precise dependency; eligible research/architecture work can continue.
- Backend: read docs/agents/BACKEND.md; own docs/architecture/**. Recommend the smallest architecture for the available runtime, real provider capabilities, durable jobs/media, visitor identity and deployment constraints. Cite current official API documentation. Propose the shared contract; do not independently choose dependencies or write application code.
- Researcher: read docs/agents/RESEARCHER.md; own docs/recon/scope-recommendation.md. Rank the chosen workflows and propose one or two improvements supported by actual observations. Explain deliberate omissions and a coherent demo story.

Use the TEAM handoff with exclusive paths and short time allowances. Root owns the final briefs, decisions, acceptance criteria, future shared contracts and all dependency choices.

## Resolve the product

Choose one strong visual system now. Media should dominate; controls must remain readable and predictable. Define Explore, Studio, Library and asset details, including desktop/mobile order, keyboard behavior and loading/error states. Keep the task, model, supported reference role and action copy consistent. Specify empty, uploaded, submitting, pending, uncertain, successful, failed, limited and restored states. Prepared samples must be labeled.

Set essential scope and explicit cuts. Use a compact preset collection whose selections actually populate supported settings. Keep uploaded/generated media, project history and variations connected. Do not add a node editor, full billing, team administration, a social network or every original model unless the core is complete and the remaining clock justifies it.

## Resolve the engineering

Select one familiar full-stack TypeScript/React application and accessible hosting/data/media services. Verify installed runtime and current official integration requirements; do not choose versions from stale memory. Establish provider/model IDs, supported inputs/settings, output lifetime, job retrieval and documented idempotency behavior. Identify the user-approved paid cap before any billable work.

Finalize the project/asset/job/preset data model, visitor ownership, request validation, errors, immutable request snapshots and state transitions. Preserve an uncertain provider outcome rather than treating a timeout as a confirmed failure. Decide how reload restores work and how duplicate paid requests are prevented. Limit abstraction to what the first real integration needs.

Publish exact planned writable paths for frontend, backend and designer. Root owns shared contracts, root layout/config, manifests, lockfile and migration/dependency coordination. Specialists must request shared changes through root. Do not let parallel workers define incompatible request shapes.

## Exit

Update docs/DESIGN-BRIEF.md, docs/TECH-SPEC.md, docs/DECISIONS.md and docs/ACCEPTANCE.md to reflect actual choices, with links to the specialists' concise evidence. The Phase 2 gate concerns an agreed design direction and contracts; final rendered design verification occurs after implementation.

Verify the actual Apple Design dependency is satisfied, scope is small enough, interfaces agree and the next three implementation tasks are independently writable. Commit decisions plus current authentic logs, update status, and proceed to Phase 3 without routine approval. Raise only concrete unavailable prerequisites; never declare a proposal implemented.
