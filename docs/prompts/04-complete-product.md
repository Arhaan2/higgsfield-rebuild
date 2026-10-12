# Phase 4 — Complete the creative loop across Explore, Studio and Library

Act as the lead coordinator. Extend the proven upload-to-video path into the full focused product. A creator should discover a starting look, create or supply an image, animate it, inspect the actual settings, make a variation, and return to saved work without losing context.

Read AGENTS.md, docs/PROJECT-BRIEF.md, docs/DESIGN-BRIEF.md, docs/TECH-SPEC.md, docs/ACCEPTANCE.md, docs/STATUS.md, and docs/agents/TEAM.md. Require the verified Phase 3 result. Use the actual approved provider capabilities and remaining spending allowance. Review the clock; do not expand beyond the agreed essential scope.

## Assign bounded parallel work

- Frontend: own the assigned Explore, Studio handoff, Library and asset-detail feature paths. Implement the connected journey and meaningful states using existing tokens/contracts.
- Backend: own assigned image-generation, library/reuse and persistence routes. Add only necessary provider operations and enforce the existing validation, ownership, duplicate protection and usage policy.
- Reviewer: own docs/verification/phase-4.md and only explicitly assigned risk-focused tests. Review integrated flows independently and identify disconnects between UI claims and server behavior. Product code remains read-only unless a narrow fix is reassigned.

Publish exact paths and dependencies before delegation. Root owns schema/contracts, migrations/dependencies and integrations. Resolve proposed interface changes before workers consume them. Use the TEAM task and handoff formats.

## Build the connected product

Implement text-to-image with the configured real image model, and let a completed image become the supported reference input for video generation without a manual download/upload step. Validate any format/aspect compatibility and explain a needed change before submission. Do not silently reinterpret a character reference as a start frame or promise unsupported consistency.

Create a small curated preset collection, approximately six to eight if the agreed scope supports it. Each preset must have a useful preview, clear purpose and working action that populates actual supported draft settings. Record preview provenance. Add filtering only if it helps navigation; avoid decorative controls.

Make Library display the visitor's retained projects/assets and a clearly separated labeled sample. Support view/play, metadata, reuse and real file download. Reusing an output or request should create an editable draft; it must not overwrite the old completed job. Keep iterations related and show which inputs/settings produced each output. Respect the promised reload/session retention boundary and describe any actual limitation.

Preserve drafts through recoverable errors. Show clear empty, pending, uncertain, failed, complete, incompatible-input and usage-limit states. Disabled live generation must explain the actual dependency while leaving the sample inspectable. Do not add empty destinations for omitted functionality.

## Verify the outcome

Review the integrated changes and run the smallest relevant local checks. Commit the implementation with currently available authentic logs, push it and deploy that revision before testing its public behavior. Verify the deployed revision, then run the complete real prompt → image → video → library → reuse/download path in that deployed environment within the authorized cap. Reuse prior real evidence for unchanged components; focus new checks on the handoff and persistence. Refresh during a job and after completion. Verify controls map to actual request settings and one visitor cannot retrieve another's private work. Confirm sample content cannot be mistaken for a fresh generated result.

The reviewer returns concrete findings with reproduction steps, expected/observed behavior and evidence. Assign targeted repairs to the correct owners, then recheck the affected path. Record actual source and deployed revisions.

Update the technical specification, acceptance checklist and status to match implemented behavior. Commit meaningful changes with available authentic logs, push and deploy. If a material target cannot be completed, state the dependency and impact; do not silently replace real generation with a simulation or mark P4 complete. Once the essential connected product works, continue to Phase 5 without routine approval.
