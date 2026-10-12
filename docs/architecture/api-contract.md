# Proposed API and persistence contract v1

Task `p2-architecture-001`; **not accepted shared code**. Root owns final types, schema and migrations. Pair with [decision.md](decision.md). All defaults below are proposed application policy, not provider guarantees.

## Identity, transport and quotas

`POST /api/guest` creates a 256-bit cryptographically random opaque token. Production cookie: `__Host-studio_guest=<base64url>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`; no Domain. Store only SHA-256 token hash plus independent UUID guest ID in D1. Return neither token nor hash in JSON. Loopback HTTP development alone may use `studio_guest` without Secure. Cookie expiry is fixed 30 days; loss/expiry means loss of guest access, not a cross-device account. Existing valid cookie returns the same guest without rotation. Expired guests cannot access their private records. No automatic ownership merge with ChatGPT identity.

Every POST/PATCH/PUT/DELETE, including guest creation, requires `Origin` exactly equal to configured `APP_ORIGIN` (scheme/host/port); absent, `null`, malformed and alternate origins receive 403. Compare to configured origin, never forwarded Host. Reject cross-site `Sec-Fetch-Site` if present, require expected Content-Type, no credentialed wildcard CORS. Local preview has one explicitly configured loopback origin. Owner-scoped reads use cookie lookup and SQL ownership predicates; foreign/missing IDs return the same 404. Missing/expired session returns 401. Private JSON/media use `Cache-Control: private, no-store` and `Vary: Cookie`; no shared page/API cache containing guest data.

Initial bounds: 1,000 guest records; 5,000 private projects total/20 per guest; 500 private asset slots total/12 per guest (held uploads/output reservations count as slots); 10,000 job records total/100 per guest; 250,000,000 stored-or-reserved media bytes globally/25,000,000 per guest. Guest uploads: at most 10/hour; guest content writes 60/hour, excluding refresh; refresh POSTs 20/minute per guest; project/job reads 120/minute per guest. New sessions: 10/minute globally. Rate counters have fixed UTC buckets, atomic admission, bounded retention (delete expired buckets during later writes); no IP collection needed for this initial scope. Cookie rotation can evade guest quotas, so global caps are mandatory. Deny new writes when caps are full; do not evict existing work silently. Root confirms hosting controls for traffic abuse before publication.

Upload byte limits are decimal: **5,000,000 bytes**, `image/jpeg` or `image/png` only, filename extension `.jpg/.jpeg/.png`, matching signature/structural metadata; reject malformed/truncated headers, SVG, animation, unsupported types and mismatches. Width/height each 256–4,096 inclusive, at most 16,000,000 pixels. These are application restrictions. Reject compressed request bodies; count received bytes even without Content-Length. Do not use unbounded `request.formData()`. Proposed upload is a raw-body request so parser limits apply before buffering. Validate PNG chunk boundaries/IHDR/IEND and JPEG segment boundaries/SOF/EOI; a successful full model decode remains unverified until tested. Serve only fixed validated image MIME with `X-Content-Type-Options:nosniff`.

Reserve storage before R2 writes, counting uncertain/orphan transfers until reconciliation. Image output ceiling 5,000,000 bytes; video ceiling 20,000,000 bytes. Reserve the full output ceiling when admitting a job; atomically replace it with actual size after storage success. If output exceeds limits, retain job/provider identity and show transfer failure. No regeneration. This intentionally bounds an evaluator demo; file-size guarantees from Kling are unknown.

## Common shapes

All IDs are UUIDs (catalog IDs are stable slugs); timestamps are UTC RFC3339 strings in JSON and integer Unix milliseconds in D1. Integers must be safe integers; no coercion. Reject unknown input keys. JSON bodies max 16 KiB; prompt length counted as Unicode code points; trim outer whitespace on save. Dates, owner IDs, model IDs, status, price and object keys are server-owned. Validate every non-null asset reference on draft save and again at job snapshot creation: it must be a retained JPEG/PNG belonging to this guest or a public catalog image. Same-guest cross-project reuse is permitted; a foreign guest's ID is not. Upload filenames are 1–120 characters after basename normalization; reject path separators/control characters and derive MIME-safe download extensions server-side.

```ts
type Operation = "text_to_image" | "image_to_video";
type Draft =
  | { operation: "text_to_image"; prompt: string; presetId: string | null }
  | { operation: "image_to_video"; prompt: string; presetId: string | null;
      startAssetId: string | null };
// Draft prompt 0..2500 characters; submission requires 1..2500 after trim.
// Video draft may lack its image; submission cannot.
type Project = {
  id: string; title: string; draft: Draft; revision: number;
  preferredAssetId: string | null; createdAt: string; updatedAt: string;
};
type Asset = {
  id: string; projectId: string | null; kind: "image" | "video";
  source: "upload" | "generation" | "sample";
  fileName: string; mimeType: "image/jpeg" | "image/png" | "video/mp4";
  byteSize: number; width: number | null; height: number | null;
  durationSeconds: number | null; sourceJobId: string | null;
  mediaUrl: string; downloadUrl: string; createdAt: string;
};
type Preset = {
  id: string; title: string; description: string; operation: Operation;
  previewAssetId: string; draft: Draft;
  attribution: { label: string; url: string | null }; isPreparedSample: true;
};
type JobStatus = "prepared" | "submitting" | "submission_unknown" |
  "queued" | "running" | "storing" | "succeeded" | "failed" | "transfer_failed";
type SnapshotBase = {
  schemaVersion: 1; provider: "fal";
  prompt: string; presetId: string | null; presetVersion: number | null;
};
type Snapshot = SnapshotBase & (
  | { operation: "text_to_image"; modelId: "fal-ai/flux/schnell";
      startAsset: null; settings: {
        image_size: { width: 1280; height: 720 }; num_images: 1;
        num_inference_steps: 4; guidance_scale: 3.5;
        enable_safety_checker: true; output_format: "jpeg";
        acceleration: "none"; sync_mode: false;
      } }
  | { operation: "image_to_video";
      modelId: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";
      startAsset: { id: string; sha256: string; mimeType: "image/jpeg" | "image/png" };
      settings: { duration: "5"; negative_prompt: "blur, distort, and low quality";
        cfg_scale: 0.5 } }
);
type Job = {
  id: string; projectId: string; requestKey: string; status: JobStatus;
  snapshot: Snapshot; outputAssetIds: string[];
  resultMetadata: { seed: number | null; width: number | null;
    height: number | null; durationSeconds: number | null } | null;
  error: { code: string; message: string; recovery: "none" | "refresh" | "retry_transfer" | "revise" | "contact_owner" } | null;
  nextPollAfterMs: number | null; lastCheckedAt: string | null;
  createdAt: string; updatedAt: string;
};
type ApiResult<T> = { data: T; requestId: string };
type ApiError = { error: {
  code: string; message: string; retryable: boolean;
  fields?: Record<string, string>; retryAfterSeconds?: number;
}; requestId: string };
```

Snapshot settings are the exact frozen image/video literals in decision.md; root should express this union as two strict Zod object schemas. The input image's hash, MIME and immutable R2 bytes determine the transport data URI; never persist base64 in snapshot JSON or log it. Hash canonical normalized submit content (sorted object keys, UTF-8 JSON, SHA-256), including the resolved settings and asset hash. No provider output URLs, credentials, hashes of session tokens or raw provider errors enter browser responses. Result metadata such as actual seed is separate from immutable requested settings. A supplied presetId must exist, match the operation, and resolve to the catalog's version; otherwise return field validation error.

## Routes

All routes live under `sites/studio/app/api/` in matching Next route directories. GET lists default to 20, max 50 with opaque keyset cursor; return `{items, nextCursor}` inside `data`. Error envelopes apply except successful binary media and empty HEAD responses.

| Method and path | Input → success |
| --- | --- |
| `GET /api/capabilities` | Public; returns shape below; never prints secret presence |
| `GET /api/presets` | Public `Preset[]` |
| `GET /api/samples` | Public `{assets: Asset[], presets: Preset[]}`; static catalog with checked attribution |
| `POST /api/guest` | `{}` → 201 `{expiresAt}`, or 200 for existing guest; Set-Cookie only when created |
| `GET /api/projects` | Guest list of `Project` |
| `POST /api/projects` | `{id, title, draft}` → 201 `Project`; title 1–80 characters; client UUID allows duplicate detection. Existing same ID/content → 200; different → 409 |
| `GET /api/projects/:id` | Guest → `{project, assets: Asset[], jobs: Job[]}`; capped by project/guest limits |
| `PATCH /api/projects/:id` | `{expectedRevision, title?, draft?, preferredAssetId?}` → 200 `Project`; at least one change. Single conditional update; stale revision → 409. Preferred asset must belong to project or be a public sample |
| `POST /api/projects/:id/uploads?assetId=:uuid&filename=:urlencoded` | Raw JPEG/PNG body with exact Content-Type → 201 `Asset`. UUID is owner-scoped upload request identity. Same ID+bytes+MIME → 200 existing asset; conflict → 409; pending duplicate → 409 `UPLOAD_PENDING` with Retry-After |
| `GET /api/assets/:id` | Public sample or guest-owned → `Asset` |
| `GET, HEAD /api/assets/:id/media` | Public sample or guest-owned bytes, inline; 200/206/304 as appropriate |
| `GET, HEAD /api/assets/:id/download` | Same authorization and range behavior, attachment disposition; filename server sanitized |
| `POST /api/projects/:id/jobs` | `{requestKey: uuid, draftRevision: integer}` → 202 `Job` for new admission; replay returns 200 existing `Job` without a second submit. Snapshot comes from that persisted revision |
| `GET /api/jobs/:id` | Guest → persisted `Job`; no provider network/side effect |
| `POST /api/jobs/:id/refresh` | `{}` → 200/202 `Job`; reconcile the same provider request; never submit a replacement |
| `POST /api/jobs/:id/retry-transfer` | `{}` → 200/202 `Job` only for `transfer_failed`; same output/provider ID |

No general-purpose proxy, arbitrary model input, cancellation, deletion or background callback endpoint in v1. Reuse needs no extra endpoint: load a snapshot/sample, populate a new draft, PATCH or create a project. Image → video uses the same immutable image asset ID. Save failures preserve the local editor buffer; display “Saved” only after acknowledged revision. Keep an optional local draft recovery buffer keyed to guest/project, clearing it on session change; it is not the persistence authority.

On a job replay look up `(guest_id, request_key)` **before** checking current generation enablement or revision: return the original when project and requested draft revision match, otherwise 409 `REQUEST_KEY_CONFLICT`. Persist `requested_revision` and submit hash; never silently apply today's revised draft to an old key. A new retry after confirmed failure needs a new explicit key, quota and reservation. Client stores the key before its first POST and retains it across ambiguous browser retries. Two different keys are constrained by the one-active-job rule.

`GET /api/capabilities` returns:

```json
{"data":{"liveGeneration":{"enabled":false,"reason":"disabled","budgetLimitMicroUsd":0,"remainingMicroUsd":0},"operations":[{"id":"text_to_image","modelId":"fal-ai/flux/schnell","imageSize":{"width":1280,"height":720},"count":1},{"id":"image_to_video","modelId":"fal-ai/kling-video/v2.5-turbo/pro/image-to-video","durationSeconds":5,"referenceRole":"start_frame"}],"upload":{"mimeTypes":["image/jpeg","image/png"],"maxBytes":5000000},"samplesAvailable":true},"requestId":"server-uuid"}
```

`reason` enum: `disabled | budget_zero | budget_exhausted | unavailable | null`, with `disabled` first when the flag is off. Enabled means server policy currently permits attempted admission, never guaranteed account credits or job success. Zero-cap generation POST responds 403 `LIVE_DISABLED`/`BUDGET_ZERO` **without creating a job, reserving storage or contacting fal**. Existing recorded jobs remain readable.

Error codes: 400 `INVALID_JSON`; 401 `GUEST_REQUIRED`; 403 `ORIGIN_FORBIDDEN`, `LIVE_DISABLED`, `BUDGET_ZERO`; 404 `NOT_FOUND`; 409 `REVISION_CONFLICT`, `REQUEST_KEY_CONFLICT`, `UPLOAD_CONFLICT`, `UPLOAD_PENDING`, `JOB_ACTIVE`, `INVALID_STATE`; 413 `UPLOAD_TOO_LARGE`; 415 `UNSUPPORTED_MEDIA_TYPE`; 416 `RANGE_NOT_SATISFIABLE`; 422 `VALIDATION_FAILED`, `INVALID_IMAGE`, `INPUT_REQUIRED`; 429 `RATE_LIMITED`, `STORAGE_QUOTA`, `RECORD_QUOTA`, `GUEST_LIMIT`, `BUDGET_EXHAUSTED`; 503 `SERVICE_UNAVAILABLE`. Transient storage/provider reconciliation errors are saved on the Job with safe code/message and the route returns its current state. A failed provider submission is never advertised as safely retryable merely because HTTP was lost.

## Media semantics

R2 keys are server-built `private/{guestId}/{assetId}` or immutable root-seeded `samples/{id}`; they never appear in JSON. Buckets stay private, without an open public bucket URL. For both media routes authorize metadata before R2 access; sample visibility must come from root's catalog, not a request flag.

Use R2 head/get and stream body. Support a single `bytes=start-end`, `bytes=start-` or `bytes=-suffix` range; clamp end to size−1, reject unsatisfiable/multiple/malformed ranges with 416 and `Content-Range: bytes */size`. Valid range → 206, accurate Content-Range/Length; full → 200. Include `Accept-Ranges: bytes`, quoted ETag, content type and safe Content-Disposition (`inline`/`attachment`). HEAD has the same headers and no body. If-Range mismatch sends full 200; matching If-None-Match without Range can return 304. Tests must cover real video seeking and downloads. [Official R2 ranged-read API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).

## D1 schema/migration proposal

Use snake_case SQL; all IDs/hashes/JSON TEXT, times/counters/costs INTEGER. Each column below is required unless marked `?`. Add `NOT NULL`, enum/length/nonnegative CHECKs, `json_valid()` for JSON, UUID validation in server schemas, foreign keys, and indices on owner/date/status. Root generates `drizzle/0000_*.sql` from `db/schema.ts` and reviews custom trigger SQL. Applied migrations/metadata are immutable. Seed policy/sample rows outside schema migrations via a root-owned bounded command.

| Table | Exact proposed columns/constraints |
| --- | --- |
| `guests` | `id PK, token_hash UNIQUE, created_at, expires_at`; no email/token plaintext |
| `projects` | `id PK, guest_id FK guests, title, draft_json, revision DEFAULT 1, preferred_asset_id?, created_at, updated_at`; `UNIQUE(id,guest_id)` |
| `assets` | `id PK, guest_id? FK guests, project_id? FK projects, source, kind, object_key UNIQUE, file_name, mime_type, byte_size, width?, height?, duration_ms?, sha256, source_job_id? UNIQUE, created_at`; sample has null guest/project, private upload/generation requires both; `(project_id,guest_id)` composite FK prevents cross-owner association |
| `jobs` | `id PK, guest_id FK guests, project_id, request_key, requested_revision, submit_hash, snapshot_json, status, provider_request_id? UNIQUE, provider_status_url?, provider_result_url?, provider_output_json?, actual_metadata_json?, output_asset_id? UNIQUE, error_code?, error_message?, reserve_micro_usd, accounting_state, lease_token?, lease_expires_at?, next_poll_at?, last_checked_at?, created_at, updated_at`; `UNIQUE(guest_id,request_key)`; composite project/guest FK; accounting state `held|committed|released` |
| `budget_policy` | `id INTEGER PK CHECK(id=1), cap_micro_usd DEFAULT 0, updated_at`; missing row denies admission |
| `storage_reservations` | `id PK, guest_id FK guests, project_id, asset_id UNIQUE, job_id? UNIQUE, bytes, state, content_sha256?, content_mime_type?, lease_token?, lease_expires_at?, created_at, updated_at`; `state=held|stored|released`; bytes represent reserved ceiling while held, actual retained bytes while stored; absent assets on crashes remain counted |
| `rate_buckets` | `scope, subject, window_start, count`; composite PK `(scope,subject,window_start)`; subject fixed global or guest UUID, never raw cookie |

Public presets/sample metadata live in root-owned versioned `src/catalog/` manifests, not mutable user tables. Seed sample R2 assets once with fixed checksums and license/attribution. Do not accept sample provenance from clients. `preferred_asset_id` is validated on writes; nullable FK can be added after asset table creation. Inputs referenced by snapshots are immutable; v1 exposes no deletion that can break them. Add a BEFORE UPDATE trigger rejecting changes to job owner/project/request key/revision/hash/snapshot/cost. Use server-internal transitions only for accounting and state. Cookie expiry does not promise physical deletion: no automated purge is proposed; root must document retention and operate bounded cleanup before reclaiming inaccessible records.

For uploads, a short lease on the unique storage reservation owns the write. After bounded byte validation, fix its content hash/MIME before R2 put; future requests with different content cannot take over. An expired lease first checks the deterministic R2 key and reconciles its metadata. If no object exists, the same validated bytes may retry a conditional first-write; an existing different hash fails. An interrupted upload's reservation stays held until a checked R2 absence/deletion allows release. Never let a concurrent replay overwrite bytes already referenced by a job.

### Atomic budget/job admission

Small scope permits summing indexed `jobs.reserve_micro_usd` for `accounting_state IN ('held','committed')`, eliminating fragile mirrored counters. Reservation moves between held/committed without increasing available budget. Released requires root-audited billing evidence; never automatic on uncertainty.

Use **one guarded INSERT statement** for admission, with BEFORE INSERT triggers validating global cap, guest allowance, active-job count, owned current project revision and available global/guest storage. Its AFTER INSERT trigger creates the matching `storage_reservations` row (5 MB image/20 MB video); trigger failure rolls back the job statement. Apply equivalent before-insert quota checks to direct upload reservations. No JS read-then-insert budget check is authoritative.

Conceptual SQL shape (root must implement and race-test actual D1 SQL):

```sql
INSERT INTO jobs (..., reserve_micro_usd, accounting_state, status)
SELECT ..., :cost, 'held', 'prepared'
WHERE :live_enabled = 1
  AND :runtime_cap > 0
  AND :cost + COALESCE((SELECT SUM(reserve_micro_usd) FROM jobs
       WHERE accounting_state IN ('held','committed')), 0)
      <= MIN(:runtime_cap, COALESCE((SELECT cap_micro_usd
                                     FROM budget_policy WHERE id=1), 0));
```

The trigger enforces the DB cap even if a caller omits this guard, plus the guest 500,000 micro-USD cap and one job in `prepared/submitting/submission_unknown/queued/running/storing/transfer_failed`. Unknown and unsettled transfer states remain active by policy. Unique request-key violations return existing matching job, not a new reservation. Failure before any submit can release a reservation only after proving the job never left `prepared`; lease loss after `submitting` is ambiguous.

D1 provides prepared statements and batching; use a single statement per `prepare()`. The safety argument here relies on atomic guarded statement/trigger execution, **not a multi-request JavaScript transaction**. Verify in local D1 and deployed bindings; SQLite-only checks do not prove hosted behavior. [D1 database API](https://developers.cloudflare.com/d1/worker-api/d1-database/).

### Durable job transitions and recovery

1. Admit `prepared` with immutable snapshot, cost and output reservation. Before the first POST, recheck the live flag, current caps and service availability. A compare-and-swap changes `prepared → submitting`, recording a unique submit lease. Only that winner may send one fal POST. `prepared` is safe to resume through refresh if it never transitioned; this starts the original admitted job, not a replacement. Stale `submitting` without recorded provider ID becomes `submission_unknown`, never `prepared` again. If configuration disables an unsubmitted prepared job, fail it and release reservations only while proving no transition to submitting occurred.
2. Submit timeout 20 seconds, no auto-retry. Save returned request ID/validated URLs immediately. Accepted `IN_QUEUE → queued`, `IN_PROGRESS → running`. Malformed/lost response, ambiguous upstream failure or DB failure after send preserves held funds and unknown outcome. Even an upstream failure is not proof of no charge. If ID is known, attach it and reconcile; otherwise root must inspect provider history/support manually. No public API allows a user to attach arbitrary provider IDs.
3. Browser polls using refresh POST at 3 seconds, backing off 5/10/15 seconds with jitter. Persist `next_poll_at`; server enforces it across tabs. Acquire a 60-second lease by conditional UPDATE before GET status/result or transfer; token-match all writes so an expired owner cannot overwrite a successor. Keep individual upstream calls below the lease; extend before transfer if needed. Close/hidden page stops polling, never cancels the job.
4. Provider `COMPLETED` requires parsing error/result. A confirmed error gives `failed` with preserved draft and conservative committed accounting until billing reconciliation. Temporary GET/timeout/404 keeps last known pending state plus safe retry message; it never authorizes a new POST. Successful result JSON is stored server-side before copying bytes; then `storing`.
5. Stream validated output to deterministic R2 object key. After successful put/head, atomically insert its Asset, settle actual storage bytes, set `output_asset_id`, and mark `succeeded`. Use a unique `source_job_id` and token-matched updates so concurrent/retried storage cannot create extra visible assets. If R2 succeeds but D1 fails, retry/reconcile deterministic object first. Never assume R2+D1 distributed atomicity.
6. Copy/network/type/host/size/storage failures produce `transfer_failed`, retain provider result/ID and reservation; retry-transfer only retrieves or copies the same output. Expired provider media may be unrecoverable: keep that fact, inputs and original identity; do not regenerate automatically. A public success requires retained R2 media, not merely a fal URL.

There is no webhook or guaranteed unattended reconciliation. This is a bounded polling proposal with durable state, not exactly-once distributed execution.

## Required verification when implemented

Root/verification should cover: anonymous/public deep link; two independent cookies cannot read each other's projects/jobs/media or reuse foreign inputs; Origin failures; reload/conflicting-tab draft revisions; malformed/oversize/chunked uploads; simultaneous storage quota admissions; sample attribution/provenance; range/HEAD/seek/download; zero flag+zero cap+key still cause zero provider calls; concurrent duplicate keys and different keys at last budget unit; provider timeout after acceptance leaves one held unknown job; lease expiry cannot resubmit; result-copy failure/retry creates one stored asset; secret/provider URL exclusion from bundles/responses. Mocks establish contract behavior only. Authorized real FLUX/Kling on the deployed revision, source compatibility, result playback and invoice reconciliation remain V3 dependencies.

Actual checks for this architecture task: required file/skill/template reads, read-only official docs, output/ownership self-review and local document integrity checks. Python checks found balanced fences, no trailing whitespace and no missing local document/skill links in either authored file; assignment text was matched verbatim in the one matching capture log. No application tests, SQL execution, request submission, provider authentication, install, migration or deployment ran. Capture session `01a12db6-2de4-7e93-a998-a1abf94399a1`; observed logger destination `.agent-logs/2026-10-12_01-24-37_01a12db6-2de4-7e93-a998-a1abf94399a1.md` contains the actual prompt. Final-response coverage remains for root to verify after emission.
