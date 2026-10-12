# Phase 3 — Deploy and prove uploaded image to real video

Act as the lead coordinator. The outcome of this phase is a publicly accessible application where a valid uploaded image creates a real video, the result plays and downloads, and its job/result survive reload. This is the highest-risk path and must work before feature expansion.

Read AGENTS.md, docs/PROJECT-BRIEF.md, docs/DESIGN-BRIEF.md, docs/TECH-SPEC.md, docs/ACCEPTANCE.md, docs/STATUS.md, and docs/agents/TEAM.md. Verify C0, R1 and D2 from actual evidence. Confirm live provider access and the user's spending cap before making billable calls. Keep credentials in server-side environment controls, outside prompts, logs and source.

## Establish the application, then delegate

Root creates the minimal agreed framework scaffold, pins actual dependencies, creates shared contracts and environment validation, and publishes exact file ownership. Use the chosen documented deployment route. Deploy the minimal runnable shell early; record its actual public URL and source revision. Do not wait until the final phase to discover hosting problems.

Assign up to three captured workers:

- Frontend: implement upload, draft/controls, job state, result playback/download and restoration within explicitly assigned component/feature/page paths. Consume root contracts and the agreed design.
- Backend: implement owned upload/job/result routes, provider adapter, durable state/media and visitor ownership within assigned server paths. Use the real provider's documented capabilities.
- Designer: implement the agreed tokens and visual primitives in explicitly assigned style paths; inspect the first rendered flow against Apple Design guidance. Do not edit frontend-owned components without an ownership handoff.

Read each role brief. Specify exact paths, observable acceptance criteria, provider constraints, time allowance and the TEAM handoff. Root alone changes dependencies, shared types, configuration, integrations, commits and deploys.

## Required real behavior

Validate supported uploads on the server and show an accurate preview. Submit only supported settings and input roles. Create an immutable request/job record, enforce visitor ownership and server-side usage limits, and connect the provider's job identity. Restore pending/completed work after refresh.

Protect against duplicate submissions at the server boundary. If submission times out ambiguously, preserve and reconcile the original logical operation using documented provider support; do not blindly issue another paid request. Keep status honest when reconciliation is unavailable. A confirmed failure should preserve the draft and support a deliberate new attempt. Never invent progress percentages or cancellation guarantees.

Retrieve and retain a usable output using the agreed persistence contract. The video must play in the deployed browser and a download must produce the actual media file. Prepared samples may help empty states, but must never be returned as the result of a live generation request.

## Integrate and verify

Review worker changes against the contracts, fix integration mismatches at their owner, and run the smallest relevant local checks. Commit the integrated implementation with currently available authentic logs, push it and deploy that revision. Verify the deployed revision, then test one authorized real generation on that public deployment. Record safe request/job identifiers, source/deployed revisions, actual input/output and observed playback, download and reload behavior. Do not commit private prompts or media without the user's intent.

Use targeted checks for upload validation, duplicate/uncertain submission and ownership where those risks exist. Distinguish simulated failure tests from live provider evidence. Do not broaden testing without a concrete unresolved risk.

Update the setup instructions with actual commands and environment names, and record remaining limitations. Commit meaningful increments with currently available raw logs, push and deploy the integrated path. Verify it opens without the developer's login. If provider access remains blocked, complete independent implementation checks but keep V3 explicitly pending; never claim a mock passed the real integration gate.

When the public real creation path is verified, update docs/STATUS.md and continue to Phase 4. Report the concrete result and next dependency, not just a list of files written.
