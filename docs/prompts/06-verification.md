# Phase 6 — Independently verify the product a reviewer will receive

Act as the lead coordinator. Determine whether the current public deployment, repository and claims are ready for evaluation. Concentrate on failures that prevent creation, lose work, expose another visitor's media, unexpectedly spend credits or make the demo misleading. Evidence must refer to the actual revision that will be submitted.

Read AGENTS.md, docs/TECH-SPEC.md, docs/ACCEPTANCE.md, docs/STATUS.md, docs/SUBMISSION.md, and docs/agents/TEAM.md. Confirm the current source/deployed revisions and remaining generation allowance. Reuse existing valid evidence where behavior is unchanged; do not repeat paid success calls without a reason.

## Independent review and bounded repairs

Assign Reviewer, using docs/agents/REVIEWER.md, ownership of docs/verification/phase-6.md and explicitly allocated tests. Give actual deployed URL, revision, acceptance criteria and prior evidence. Ask for a release verdict based on observation, not a code summary. Keep product code read-only for the reviewer.

Keep frontend and backend specialists available for narrowly assigned fixes, each with exclusive paths and a reproduction. Root owns contracts, dependencies, migrations, integration, git and deployment. Do not let the author of a fix mark an unobserved result passed; have the reviewer verify the affected behavior.

## Required checks

1. Open the live link in a fresh signed-out evaluation context. Confirm it loads without the developer's login, localhost services or development-only protection. Reload an important deep route. Inspect the labeled sample immediately.
2. Verify the supported creation path and review actual real-provider evidence from the current implementation. Confirm inputs/settings, playable/viewable output, download and the image-to-video handoff. Mocks do not prove real generation. If a material integration changed, run the smallest necessary authorized live check.
3. Verify draft retention, job/result restoration after refresh, saved history and reuse. Check a relevant invalid upload and recoverable failure. Exercise pending/unknown submission behavior through controlled tests without accidentally creating repeated paid jobs.
4. Check server-side duplicate protection, visitor ownership and usage enforcement, including in-flight work. Use disposable test identities/data. Do not expose unrelated user data or load-test a paid provider. Confirm the public app's actual limits and disabled states match its copy.
5. Check core desktop/mobile layout, keyboard navigation, visible focus, forms, touch controls, reduced motion and error feedback. Concentrate on exposed essential controls.
6. Open the repository without owner credentials. Confirm source/setup documentation, authentic incremental .agent-logs/, real two-session CAPTURE-TEST evidence, actual delegated coverage and absence of exposed secrets. Inspect history rather than merely checking the folder exists. Do not edit raw transcripts to make them appear compliant.

Record each applicable check as pass, fail or not_run, with method, observed result, safe evidence and source/deployed revision. Preserve selected durable evidence under docs/verification/ rather than relying on ignored transient test output.

## Repair and exit

Rank defects as blocking, important or cosmetic. Fix blocking issues first and important ones within the remaining clock. For each material fix, deploy if needed and recheck the affected path. Broaden regression checks only where the change creates a concrete remaining risk. Stop optional testing once the release criteria are sufficiently verified.

Update docs/ACCEPTANCE.md and docs/STATUS.md with actual results and precise unresolved dependencies. The recording can still be pending; do not mark the final submission gate passed without it. Commit repairs/evidence with current authentic logs, push, and record the release candidate revision. Continue to Phase 7 when the product's critical acceptance checks pass. Report a clear verdict and limitations rather than a percentage-complete claim.
