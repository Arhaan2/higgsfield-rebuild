# Technical starting specification

**Proposal only.** Phase 2 resolves actual providers, runtime, API schemas, path ownership and persistence. No endpoint or environment name below is a claim about an existing application.

## Architecture boundary

Use one familiar full-stack TypeScript/React codebase. Add the minimum durable database and media storage needed for the promised behavior. Prefer services the user already has authorized access to. Confirm current official integration documentation and hosting constraints. Keep provider credentials server-side. Document the selected stack and versions in this file, then maintain one lockfile and one root owner for dependencies.

The browser collects a draft and displays state. Server routes validate it, enforce visitor ownership and usage limits, persist jobs and assets, and talk to the generation provider. A provider adapter isolates the external API. Do not build a general multi-provider framework before one integration works.

## Domain objects

| Object | Minimum information | Important behavior |
| --- | --- | --- |
| Project | ID, visitor/owner, title, timestamps | Groups related assets and variations |
| Asset | ID, owner/project, media kind, durable location, metadata, source job if generated | Uploaded references and generated outputs remain distinct |
| GenerationJob | ID, owner/project, immutable draft snapshot, logical request ID, provider job/reference, status, output IDs, timestamps, safe error detail | Can be resumed/reconciled across page reloads |
| Preset | ID, title, preview/source attribution, operation, supported settings | Populates a real draft; does not promise unsupported controls |

A request snapshot includes actual prompt, selected provider/model, supported settings and input asset references. The result can display that snapshot and reuse it. Do not mutate an old completed job when the user creates a variation.

## Shared contract to finalize

Agree request validation, response/error structure, supported capabilities and state transitions before parallel implementation. Root owns the shared types and the capability matrix. A useful provider contract can submit a job, retrieve its status/result, and cancel only where genuinely supported. Record when the provider cannot offer a requested behavior.

Do not assume fixed durations, resolutions, reference counts, end-frame support, character consistency or cancellation. Populate controls from the capabilities actually implemented. Every visible selection must map to a real validated request.

## Uploads and ownership

Validate file type, size and required metadata server-side; use a narrow, documented supported input set. Make uploads visible as a preview, preserve the selected reference on recoverable errors, and use internal asset IDs in application requests. Verify ownership when an asset/job is accessed. A public sample project is separate from private guest work. Avoid arbitrary server-side fetching of caller-provided URLs; prefer owned uploads and validated provider output locations.

## Generation lifecycle

Persist a logical request before provider submission. Choose clear UI states that reflect the real backend, such as submitting, accepted/pending, running, succeeded and failed. Preserve an explicit unknown outcome when submission or polling is inconclusive. A timeout is not automatically a failed generation.

Use provider idempotency/reconciliation features where documented. If submission outcome is uncertain, retain the logical request, attempt supported lookup/reconciliation, and prevent an automatic second paid operation. Explain the unresolved state honestly if the API cannot determine it. A user-requested new attempt after a confirmed failure creates a new logical operation; reusing the same key must not accidentally resurrect a failed request.

Persist completed outputs in a durable way compatible with the provider's terms and URL lifetime. Make refresh restore the correct job/result. Do not report invented percentage progress or claim cancellation when only local polling stopped.

## Budget and guest access

No paid amount is authorized by this kit. Resolve the user's cap and provider access before billable requests. Track costs/estimates and usage limits on the server; client counters alone are insufficient. Record the chosen enforcement policy, including how in-flight jobs count against the cap. When live generation is disabled or exhausted, keep the labeled sample project inspectable and explain the limitation.

## Testing boundary

Write only meaningful checks for actual risks: request validation, ownership, duplicate/uncertain submission, retained drafts, refresh persistence and the critical browser journey. Use isolated disposable data for simulated failures. Test the required real provider operations in the public deployment within the approved budget. Reuse independently inspectable evidence on the unchanged build; another paid run requires an uncovered behavior, a relevant change or a concrete remaining uncertainty. Test API mocks are useful for controlled behavior but do not prove real generation.

## Deployment

Create the first public deployment once the Phase 3 scaffold runs. Verify access without the creator's authentication and reload a deep route. Record the source commit and deployed revision so tests point to the actual submitted build. Keep environment setup, migrations and deploy commands reproducible. Recheck affected live behavior after material deployment changes.

## Architecture decisions to fill in Phase 2

Runtime and package manager; actual framework/versions; provider/model IDs and current documentation; credential presence without values; cost and cap; database/media persistence; guest identity and authorization; public host; request/job contracts; capability matrix; exact agent-owned paths; required success/failure verification.
