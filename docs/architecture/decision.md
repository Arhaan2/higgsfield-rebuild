# Architecture proposal — p2-architecture-001

Status: **proposal for root to finalize**, checked 2026-10-12 UTC. No application, account, generation, migration or deployment was exercised. Assigned capture prerequisites are accepted from the handoff; the research exception permits design/implementation but **does not verify research**. Generation allowance remains **$0**. This replaces the earlier conditional Vercel/Supabase recommendation if root verifies Sites; it does not claim those services were provisioned or are needed.

## Smallest useful implementation

Use the supplied **Sites Vinext React/TypeScript starter**, one Worker, one D1 `DB` binding and one private R2 `BUCKET` binding. Keep Next-style `app/` routes, Drizzle schema/migrations, and the supplied `sites()` build integration. Use native server `fetch` for the two fal endpoints; no provider SDK or multi-provider abstraction is necessary. The starter already supplies Zod. Root chooses the actual installed versions and retains its lockfile; observed template versions include Vinext `1.0.0-beta.5`, React `19.2.6`, Drizzle `0.45.2`, and TypeScript `5.9.3`. These are template observations, not a successful installation.

Sources read: installed [Sites skill](/Users/arhaan/.codex/plugins/cache/openai-curated-remote/sites/1.0.1/skills/sites/SKILL.md), [storage reference](/Users/arhaan/.codex/plugins/cache/openai-curated-remote/sites/1.0.1/skills/sites/references/storage.md), [identity/secrets reference](/Users/arhaan/.codex/plugins/cache/openai-curated-remote/sites/1.0.1/skills/sites/references/identity-and-secrets.md), [Vinext README](/Users/arhaan/.codex/plugins/cache/openai-curated-remote/sites/1.0.1/skills/sites/templates/vinext-starter/README.md), and its manifest, package, schema and database helper.

Proposed checkout is `sites/studio/` inside the original repository. Root must verify managed source synchronization and how that source is included in the public parent repository (avoid an accidental untracked nested repository/gitlink). All specialist session CWDs remain the original capture root. Root alone creates/registers/publishes the Site, persists the returned project ID, sets `d1: "DB"`, `r2: "BUCKET"`, configures secrets and public audience, and records the Sites source revision alongside the public GitHub revision. No registration or publication was performed here. A private Site cannot satisfy the public-entry requirement.

Keep `app/chatgpt-auth.ts` and platform-owned sign-in routes intact. Do not call `requireChatGPTUser` on Explore, Studio, Library or these guest APIs. Guest cookie ownership is a scoped anonymous capability, not another OAuth system. Signed-in Sites identity does not automatically claim an existing guest's records; account linking is omitted. The public sample catalog is readable without creating a guest session.

## Capabilities and cuts

| Surface | Zero-spend delivery | Later live capability, still disabled |
| --- | --- | --- |
| Explore | Small attributed, explicitly prepared preset/sample catalog; inspect and download samples | Preset fills a real validated draft |
| Studio | Save/reload draft, upload JPEG/PNG, preview, edit, reuse an image or saved settings | Text → one image; one start image → 5-second video |
| Library/detail | Guest projects/assets/history, sample distinction, playback and ranged download | Stored generated outputs and immutable job settings |
| Recovery | Preserve inputs, clear error/status messages | Resume same request; retry storage independently |

No cancellation button, webhook, cron, queue service, end-frame picker, seed control, resolution picker for video, billing, account linking or arbitrary remote URL upload. Presets modify prompt text and supported task settings; a cinematic motion phrase is not a guaranteed camera-control API. The zero-spend path can demonstrate upload/save/inspect/reuse/download but **cannot pass V3 real-generation**, nor the real image → video acceptance checks.

Applied [apple-design](/Users/arhaan/.codex/skills/apple-design/SKILL.md): immediate local interaction feedback, explicit status/completion/error feedback, agency through retained drafts and variations, and controls whose labels match their actual purpose. Backend state never produces invented percentage progress. Visual design remains the designer's assignment.

## Two concrete provider mappings

| Operation | Exact endpoint and proposed payload |
| --- | --- |
| `text_to_image` | `fal-ai/flux/schnell`: `prompt`, `image_size: {width:1280,height:720}`, `num_images:1`, `num_inference_steps:4`, `guidance_scale:3.5`, `enable_safety_checker:true`, `output_format:"jpeg"`, `acceleration:"none"`, `sync_mode:false`. No reference image or exposed seed. Read `images[0]`, actual dimensions/seed from output. |
| `image_to_video` | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`: `prompt`, `image_url` derived server-side from owned/sample image bytes as a base64 data URI, `duration:"5"`, `negative_prompt:"blur, distort, and low quality"`, `cfg_scale:0.5`; omit `tail_image_url`. Read `video.url`; do not promise output dimensions, audio, codec or file size before testing. |

The [FLUX schema](https://fal.ai/models/fal-ai/flux/schnell/api) documents custom image dimensions and these settings. The [Kling schema](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/api) accepts URLs/data URIs; its [official OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-video/v2.5-turbo/pro/image-to-video) limits prompt/negative prompt to 2,500 characters and CFG to 0–1. Our narrower inputs are application restrictions, not claims about provider maxima. Image dimensions/decode compatibility and data-URI submission still require a later authorized live test.

## Queue and network boundary

Submit `POST https://queue.fal.run/{endpoint}` with server-only `Authorization: Key …`. Persist `request_id` and returned status/result URLs. Documented canonical reads are `GET /{endpoint}/requests/{id}/status` and `GET /{endpoint}/requests/{id}`. Prefer validated returned URLs: queue examples also show result URLs ending `/response`, so do not replace a returned URL with a guessed variant. `IN_QUEUE`, `IN_PROGRESS`, `COMPLETED` are provider states; completion can contain an error. Fetch and validate the result before storing success. [Official queue documentation](https://fal.ai/docs/documentation/model-apis/inference/queue).

Only server-constructed queue URLs or URLs returned for this request are eligible. Require HTTPS, hostname exactly `queue.fal.run`, no credentials, fragment or non-443 port, and a request path containing the exact encoded stored ID under the selected model family. Reject redirects (`redirect:"error"`); never forward the key to media hosts. Do not accept a queue or media URL from a browser request.

Output retrieval permits HTTPS `fal.media`/true subdomains of `.fal.media`, plus `storage.googleapis.com` only under `/falserverless/` (the documented Kling example). This is our conservative allowlist, **not a provider guarantee** that every future output uses it. Reject userinfo, alternate ports and redirects; an unexpected host becomes recoverable `transfer_failed` for root review, never a broad wildcard. Stream image/video bytes into R2 with a counted size ceiling and validated MIME/container; never buffer a video. Server-issued IDs address media thereafter. [Queue media example](https://fal.ai/docs/documentation/model-apis/inference/queue), [Kling output example](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/api).

No caller-supplied submit-idempotency guarantee was found in the current queue, platform-header or endpoint-schema documentation. This is a bounded documentation finding, not proof that fal can never add such a facility. Application uniqueness does not create provider exactly-once delivery. Disable automatic submission retry in application code; propose `X-Fal-No-Retry: 1`, `x-app-fal-disable-fallback: true`, `X-Fal-Request-Start-Timeout: 120`. The start timeout limits starting, not inference. The documented granular retry configuration applies only to owned apps and is not our mechanism. [Platform headers](https://fal.ai/docs/documentation/model-apis/common-parameters).

## Spend and persistence

Proposed exact configuration names: `APP_ORIGIN`, `LIVE_GENERATION_ENABLED=false`, `GENERATION_BUDGET_USD=0`, optional server secret `FAL_KEY`; bindings `DB` and `BUCKET`. No `NEXT_PUBLIC_` secret. Invalid/missing settings disable generation. A key alone never enables it. Root writes an authorized cap into the D1 singleton policy; effective cap is the minimum of that value and strictly parsed environment dollars converted to integer micro-USD. No per-request user cap, automatic top-up or daily budget reset.

Current posted model rates are $0.003 per rounded-up megapixel for [FLUX](https://fal.ai/models/fal-ai/flux/schnell), and $0.35 for [5-second Kling](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video). Propose conservative reservations of **10,000 micro-USD ($0.01)** per fixed image and **400,000 ($0.40)** per fixed video, a **500,000 ($0.50) lifetime guest allowance**, and one active/uncertain generation per guest. These are admission allowances, not actual billed amounts or authorization. Recheck price/billing behavior before enabling; a conservative estimate cannot guarantee the final provider invoice, taxes, account-wide spend or infrastructure charges.

Reserve atomically with job insertion, before network submission. Do not release funds on timeout, ambiguous HTTP responses, provider failure of unknown billing, expired results or storage failure. Move reservations to conservatively committed spend on known completion; reduce them only using independently confirmed billing/no-charge evidence. Unknown submissions keep reservations and never auto-repost. The detailed contract provides single-statement admission, transitions and separate transfer recovery.

D1 stores durable job identity and drafts. R2 stores immutable media under opaque keys with owner checks. Polling occurs only while a browser is open or on explicit refresh; durable records are **not** a background worker. Closing every tab pauses reconciliation/copying. fal media expiration is configurable; default JSON retention is documented separately. Copy promptly, expose expiration failures, and do not promise recovery after an arbitrarily long absence. No fixed provider media lifetime or private provider CDN ACL is verified. A live enablement decision must disclose the provider transfer/retention and settle account settings. [fal retention](https://fal.ai/docs/documentation/model-apis/media-expiration).

## Hosting limits and root gates

Sites documentation says hosted code runs in Workers with 128 MB/isolate and HTTP external connections; raw TCP is unavailable. Cloudflare also documents the [128 MB isolate limit](https://developers.cloudflare.com/workers/platform/limits/). Keep uploads at 5,000,000 bytes, bounded parsing, no video transcoding/native Node image stack, streaming transfers, and short request-driven provider calls. A managed Sites plan's CPU, traffic, storage, egress, audience controls and no-cost eligibility are **not established by generic Cloudflare quotas**. Quotas in our app bound accepted storage and generation but cannot make anonymous internet traffic costless or abuse-proof.

Sites applies hosted D1 migrations before Worker upload; a failed deploy may still apply a migration. Generate schema-only SQL with the supplied Drizzle workflow, inspect generated SQL/metadata, apply each local migration once, and append future migrations. Root owns the schema, migrations and seed command. No runtime DDL; no seed media in migrations. R2 is accessed through `env.BUCKET`; [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/) supports ranged reads. Platform/source-sync availability, local build, public signed-out access, migrations, D1/R2 behavior and streaming remain integration tests, not established facts.

## Proposed ownership after root accepts contracts

All paths below are relative to original capture root; `sites/studio/` is proposed and must be confirmed before delegation.

| Owner | Exclusive future paths |
| --- | --- |
| Root | `sites/studio/package*.json`, lockfiles, `.openai/**`, `build/**`, `scripts/**`, configuration files, `cloudflare-env.d.ts`, `app/layout.tsx`, `app/chatgpt-auth.ts`, `src/contracts/**`, `db/**`, `drizzle/**`, `src/catalog/**`, `public/samples/**`; all setup, managed source sync, git, capture, publishing and phase documents |
| Backend | `sites/studio/src/server/**`, `sites/studio/app/api/**`, `sites/studio/tests/server/**` only after separate implementation handoff |
| Frontend | `sites/studio/app/page.tsx`, `app/studio/**`, `app/library/**`, `sites/studio/components/studio/**`, `sites/studio/components/library/**`, `sites/studio/components/explore/**`, `sites/studio/src/client/**` |
| Designer | `docs/design/**`; later only `sites/studio/app/globals.css`, `sites/studio/styles/**` if root explicitly assigns them |
| Verification | `docs/verification/**`; implementation repairs require a new exclusive assignment |

This worker authored only `docs/architecture/decision.md` and `api-contract.md`. Root must adopt/reconcile contracts before code, update the project checkpoint, verify Sites/public hosting, and preserve the unresolved research and V3 checks. Runtime tests cannot be reported from this proposal.
