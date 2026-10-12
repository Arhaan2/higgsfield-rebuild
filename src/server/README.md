# Frame Studio backend

Implementation task `p3-backend-001`. Production code uses D1/R2 bindings; it has no in-memory persistence fallback. Live generation remains disabled with no approved allowance. Mock checks below establish application behavior, not deployed storage or provider results.

## Boundaries

- Opaque 30-day guest capability cookie; only SHA-256 token hashes are stored. Configured Origin required on mutations. Private responses are no-store. Ownership is checked before private media access, reference reuse, and changes; same-guest cross-project image reuse keeps the original asset's project.
- Raw JPEG/PNG uploads are bounded to 5,000,000 received bytes before structural validation. PNG includes chunk CRC/order checks and rejects animation markers. JPEG checks markers/segments/SOF/scans/EOI. Dimensions are 256–4,096 per side and at most 16 million pixels. These parsers do not establish full decoder/model compatibility.
- D1 guarded statements, unique keys, and `schema-guards.sql` enforce lifetime record, storage, active-job, and spending caps. Reservations count uncertain R2 objects. Uploads and outputs use deterministic private keys and conditional first-write; stale lease holders cannot publish a new visible asset.
- Request-key replay precedes current generation policy and draft revision checks. New jobs require the live flag, positive environment and DB caps, and server credentials. Admission reserves $0.01/image or $0.40/video conservatively; these are allowances, not billing assertions. Unknown submissions hold their allowance and require owner review when no provider ID is known.
- One bounded fal POST, no automatic submission retry/fallback. Polling and transfer retries reconcile the same provider request. Request-driven reconciliation pauses when nobody refreshes. No webhook, background worker, reconciliation-by-client-ID API, cancellation, arbitrary proxy, or client-supplied provider URL exists.
- Generated image transfer buffers at most 5 MB; video transfer streams at most 20 MB through Workers' FixedLengthStream with SHA-256 and MP4 top-level box validation. Video must declare Content-Length. Missing length, unexpected CDN hosts/MIME, or unsupported/corrupt containers remain transfer failures. Codec compatibility/playback is not proven by structural validation. Actual video dimensions/duration may remain null.
- Samples are independent licensed files from the root catalog and static `/samples/` paths. Reading samples never submits generation. After enablement only, sample input bytes are loaded from the configured APP_ORIGIN plus the exact catalog path, checksum-verified, and sent as an image data URI.

## Verification

Run from the original repository root:

```sh
node --import ./tests/server/register.mjs --test tests/server/*.test.mjs
npx tsc --noEmit
npx eslint src/server app/api tests/server db/schema.ts
```

The Node harness creates an isolated in-memory SQLite database from Drizzle declarations and executes the real guard SQL. R2 and fetch are injected mocks; the video test substitutes a test-only FixedLengthStream. The tests make no network requests, execute no project migrations, and create no infrastructure. They exercise public API responses, persisted rows, concurrency interleavings, invalid input, quotas, stale leases, unknown submission, and bounded transfer. Root must separately test generated migrations and the real D1/R2 bindings after integration.

## Primary references read on 2026-10-12

The adapter's fixed payloads follow the [FLUX schnell schema](https://fal.ai/models/fal-ai/flux/schnell/api) and [Kling 2.5 Turbo Pro schema](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/api). Request identities and status/result reads follow the [queue API](https://fal.ai/docs/documentation/model-apis/inference/queue); retry/fallback headers follow [platform headers](https://fal.ai/docs/documentation/model-apis/common-parameters). Provider compatibility and billing remain unverified.

Prepared statements/batches and storage access follow the [D1 binding API](https://developers.cloudflare.com/d1/worker-api/d1-database/) and [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/). The code follows [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) for bindings, secrets, bounded payloads, and awaited asynchronous work. Runtime signatures were checked against `.cache/workers-types-latest/package/index.d.ts` and the root-generated binding declarations. Local SQLite tests do not establish hosted D1 guarantees.
