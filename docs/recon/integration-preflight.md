# Integration preflight — p1-integration-preflight-001

Checked **2026-10-12 UTC** (11 October Pacific). Backend worker; accountable owner: main Desktop coordinator. This is Phase 0/1 research, not an implemented or tested architecture. R1 remains pending. **Spending: $0; no generation, provisioning, installation, signup, deployment, or git operation performed.**

**Finding:** the documented APIs can cover both creation steps, but no complete usable service chain is verified. The only positive local service-access signal is a Vercel credential file with a nonempty token; its validity is unknown. Generation and durable data/media credentials were absent in the bounded checks below.

## Observed local access

Read all seven assigned project documents, the handoff template, and `.env.example`. Its names are proposals, not configuration. The assignment supplies the successful CLI capture canary; this worker did not repeat its verification or spawn children.

| Actual check | Observed outcome | Boundary |
| --- | --- | --- |
| `node --version`; `npm --version`; `python3 --version` | v24.18.0; 11.16.0; Python 3.13.5; each exit 0 | Runtime availability only; no application build |
| `command -v stripe`; `stripe version`; `stripe directory --help` | Stripe absent; latter commands exit 127 | Directory/plugin version and authentication cannot be verified |
| Python `shutil.which` for service CLIs | `vercel`, `wrangler`, `supabase`, `stripe`: false; `gh`: true | No CLI installation attempted |
| Python `Path.exists()` on named repository paths | `.env`, `.env.local`, `.env.development`, `.env.production`, `.vercel/project.json`, `wrangler.toml`, `wrangler.json`, `wrangler.jsonc`, `package.json`: false | No blanket file scan |
| Python presence/JSON boolean check of standard Vercel auth path | `~/Library/Application Support/com.vercel.cli/auth.json`: exists, parses, nonempty token: true | No token, account email, ID, or private config printed |
| Python HTTPS GET to documented [Vercel `/v2/user`](https://vercel.com/docs/rest-api/user/get-the-user), using that token internally | Network failure; DNS error: true; no HTTP response | Cannot infer valid authentication, plan, project access, or billing |
| Official documentation fetches through web tool | fal, Supabase, Vercel pages below readable | Public documentation only; different network route from local CLI |

Environment checks evaluated `bool(os.environ.get(name))` only. **All false**:

- Project proposals: `GENERATION_API_KEY`, `GENERATION_PROVIDER`, `ENABLE_LIVE_GENERATION`, `GENERATION_BUDGET_USD`, `APP_BASE_URL`, `DATABASE_URL`, `STORAGE_BUCKET`.
- Generation: `FAL_KEY`, `FAL_API_KEY`, `REPLICATE_API_TOKEN`, `REPLICATE_API_KEY`, `RUNWAYML_API_SECRET`, `OPENAI_API_KEY`, `HIGGSFIELD_API_KEY`, `HIGGSFIELD_API_SECRET`, `HF_API_KEY`, `HF_API_SECRET`, `HF_TOKEN`.
- Infrastructure: `VERCEL_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.

Standard service locations checked for existence only, all false: `~/.config/configstore/vercel.json`, `~/.vercel/auth.json`, `~/.wrangler/config/default.toml`, `~/.config/.wrangler/config/default.toml`, `~/Library/Preferences/.wrangler/config/default.toml`, `~/.config/fal/auth0_token`, `~/.fal/auth0_token`, `~/.config/stripe/config.toml`, `~/.stripe/config.toml`, `~/.supabase/access-token`, `~/.aws/credentials`. These results do **not** establish that the user has no accounts, browser sessions, keychain entries, or remotely stored secrets; those were not inspected.

## Required Directory discovery: blocked

Read and applied the setup check in [installed stripe:stripe-directory skill](/Users/arhaan/.codex/plugins/cache/openai-curated-remote/stripe/8.0.0/skills/stripe-directory/SKILL.md) before provider research. It requires: “Before using Directory, verify that the latest version of the CLI and plugin are installed and that any required authentication is complete.” No Directory tool was exposed; Stripe CLI is absent. The mandated [setup site](https://stripe.directory) failed through the web tool with unsupported `text/markdown`; `curl --fail --silent --show-error --max-time 25 https://stripe.directory` exited 6 (DNS resolution failure). `/llms.txt` and `/docs` were inaccessible through the web tool; a site-limited setup search returned no results.

Installation is excluded by this assignment, so **Directory search and its verified engagement path remain unresolved**. Official-provider documentation below is a fallback investigation, not a Directory-verified selection. Coordinator must complete Directory discovery in an authorized environment before final provider selection.

## Conditional path and costs — documentation only

Recommend evaluating **one Next.js/TypeScript app on Vercel + one Supabase project for Postgres and private media + fal for both models**, after Directory/access verification and R1. This is an engineering recommendation, not a stack decision. It fits the brief's single React application; [Vercel explicitly supports Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs). Supabase combines database and media, while both models use the same fal queue interface. Credentials are still prerequisites.

| Component | Documented capability/cost, fetched 2026-10-12 | Implication / unknown |
| --- | --- | --- |
| Vercel Hobby | Free for personal, noncommercial use; quota exhaustion can suspend usage. [Hobby plan](https://vercel.com/docs/plans/hobby) | Coordinator must confirm project eligibility and accessible account/plan. Do not assume a paid plan or upgrade. |
| Vercel Functions | 4.5 MB request/response payload limit. Fluid Compute Hobby duration default/maximum 300 s. [Limits](https://vercel.com/docs/functions/limitations), [duration](https://vercel.com/docs/functions/configuring-functions/duration) | Submit quickly; do not wait for inference or proxy whole videos through a response. Actual project compute settings unverified. |
| Supabase Free | $0/month; Postgres 500 MB/project; storage 1 GB; egress 5 GB and cached egress 5 GB; upload maximum 50 MB; pauses after one week inactive; no automatic backups or uptime SLA. [Pricing](https://supabase.com/pricing) | Durable service candidate, not an indefinite availability guarantee. Account/project, capacity, region, quotas, and access unknown. Validate real output sizes before promising persistence. |
| fal image | `fal-ai/flux/schnell`: $0.003 per megapixel, rounded upward. [Endpoint pricing](https://fal.ai/models/fal-ai/flux/schnell) | Proposed test: one 1280×720 image (<1 megapixel), expected **$0.003** for successful generation. |
| fal video | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`: 5 s **$0.35**; $0.07/additional second, making 10 s **$0.70**. [Endpoint pricing](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video) | Proposed first test fixes duration at 5 s. Access and actual billed usage unverified. |

Expected generation subtotal: one image plus one 5-second clip **$0.353**; three such successful loops **$1.059**, before any applicable tax or infrastructure charges. Arithmetic estimate, not a completed transaction or spending approval. Infrastructure can be $0 only if eligible free accounts and remaining quotas exist. No minimum credit purchase was verified. fal documents prepaid credits; its pricing page broadly describes successful-output billing, but its FAQ warns that some invalid-input failures can incur GPU charges. Do not promise all failures are free. [Billing](https://fal.ai/docs/documentation/model-apis/pricing), [FAQ](https://fal.ai/docs/documentation/model-apis/faq).

**Fallback if access is absent:** coordinator can use Vercel's personal Git integration after authenticating if the local token/CLI route is unavailable; that route is [documented](https://vercel.com/docs/plans), not tested here. If fal or Supabase access remains missing, there is no verified alternate credential path. After R1, a clearly labeled sample and disabled live actions can support inspection while access is resolved; they do not satisfy the real-generation or durable-library acceptance criteria. Any switch of provider needs a separate bounded preflight, rather than assuming another vendor is usable.

## Generation contract to validate later

**Image:** JSON prompt required; explicit custom `image_size: {width: 1280, height: 720}`, `num_images: 1`, `num_inference_steps: 4`, `output_format: "jpeg"`, safety checker enabled; leave synchronous mode off. Documented output includes `images[]`, URLs/dimensions, seed and prompt. Formats are JPEG/PNG; `sync_mode: true` returns data URIs and omits output from history, so avoid it for this workflow. [FLUX API schema](https://fal.ai/models/fal-ai/flux/schnell/api).

**Video:** required JSON `prompt` and `image_url`; duration enum `"5"`/`"10"`; optional end image, negative prompt and CFG. OpenAPI specifies maximum 2,500 characters for prompt/negative prompt and CFG 0–1. For the minimal path use one image and 5 seconds. Output is `video.url` with optional file metadata; an MP4 example is documented, but codec, audio, resolution and size guarantees were not established. No independent resolution or camera-control field appears in this schema. [Video API](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/api), [exact OpenAPI](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/kling-video/v2.5-turbo/pro/image-to-video).

Video file inputs accept a reachable URL or base64 data URI. The playground uploader lists JPG/JPEG/PNG/WebP/GIF/AVIF/HEIC/HEIF; that UI list does not establish every model's decode/size constraints. Propose JPEG/PNG only initially, with a 5 MB application limit and server validation. These are our proposed restrictions, not verified provider maxima. Exact model pixel/byte limits and the first-frame behavior remain live-test prerequisites. [Video files documentation](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video/api), [playground](https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video).

**Authentication and asynchronous work:** keep `FAL_KEY` on the server; use `Authorization: Key …` for REST. POST to `https://queue.fal.run/{endpoint_id}`; persist `request_id` and returned status/result URLs. Queue statuses are `IN_QUEUE`, `IN_PROGRESS`, `COMPLETED`; retrieve and inspect the result/error before declaring success. SDK equivalents are `fal.queue.submit`, `.status`, `.result`. [Authentication](https://fal.ai/docs/documentation/setting-up/authentication), [queue](https://fal.ai/docs/documentation/model-apis/inference/queue).

**Timeouts/idempotency:** a client timeout does not cancel server work. The start-timeout header only bounds waiting to start, not total inference. Automatic retry and model fallback controls exist. Submission deduplication via a caller-supplied idempotency key was **not established** by the queue/headers/schema review; documented webhook deduplication is different. Do not blindly repeat a POST. Cancellation of an in-progress job may still produce a result; no refund promise. [Queue behavior](https://fal.ai/docs/documentation/model-apis/inference/queue), [platform headers](https://fal.ai/docs/documentation/model-apis/common-parameters).

**Proposed recovery:** create a durable local job and atomic budget reservation before submission; enforce a unique owner/request key; save provider identity immediately. An uncertain submission becomes `submission_unknown`, retaining its reservation and inputs until reconciliation. A verified callback can attach the provider ID to a precreated job; never trust callback URL parameters as ownership proof. No second paid submission until the first is resolved. This is a design proposal, not tested exactly-once delivery.

**Webhook/results:** fal documents signature verification using Ed25519/JWKS, raw-body hashing and timestamp checks. Persist valid callbacks before acknowledging, and deduplicate by request ID. Initial delivery timeout is 15 s; retries end at stored-result expiry (roughly 1 hour, or 6 minutes for results ≥10 KB), at most 31 retries. Some results have shorter retrievability when large or payload storage is disabled. Retain payload storage for initial validation; reconcile by polling as well. [Webhooks](https://fal.ai/docs/documentation/model-apis/inference/webhooks).

## Durable media, privacy and retention

Supabase private buckets enforce access controls and support time-limited signed download URLs; signed uploads last two hours. Proposed flow: issue an owner-scoped upload target, upload directly to storage, validate stored bytes, and give fal a signed input URL whose lifetime covers the allowed start window. Reissue download URLs from durable object IDs on reload; do not store expiring URLs as the asset identity. [Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals), [signed uploads](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl).

Proposed retained records: owner, project/version, immutable inputs/settings, provider/model/request ID, state, reserved/settled cost, object path, MIME/size and timestamps. Copy completed media into private storage and mark completion only once retained. Retry asset transfer against the same result, never regenerate to recover a failed download. Use unique object paths; Supabase recommends avoiding overwrites and using resumable uploads above 6 MB. Copy speed, >50 MB outputs, playback/range requests and signed downloads remain untested. [Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [downloads](https://supabase.com/docs/guides/storage/serving/downloads).

Provider URLs are publicly readable by default. Current fal documents differ: FAQ says at least seven days by default; platform headers say account setting, forever if unconfigured; the retention page labels media retention configurable and JSON payload retention 30 days. Treat the account's media lifetime as **unknown**, set an explicit lifecycle after validation, and copy promptly. Do not promise private originals remain private merely because our bucket is private; provider ACL/retention behavior must be settled too. [FAQ](https://fal.ai/docs/documentation/model-apis/faq), [headers](https://fal.ai/docs/documentation/model-apis/common-parameters), [retention](https://fal.ai/docs/documentation/model-apis/media-expiration).

Use server-only provider/database secrets. Supabase's current secret keys bypass RLS, so server ownership checks are mandatory; publishable keys are not visitor identity. The coordinator must select a guest/session ownership contract and enforce it on jobs, uploads, callbacks and downloads. [Supabase keys](https://supabase.com/docs/guides/getting-started/api-keys). Persistent media must have a coordinator-defined deletion/retention policy; no policy is implemented here.

## Exact prerequisites and requested decisions

| Owner | Required action before dependent work |
| --- | --- |
| Coordinator | Complete Directory discovery via an authorized working CLI/plugin; reconcile its engagement path with this conditional proposal. This worker cannot install it. |
| Coordinator/research owner | Pass R1 with actual signed-in flow evidence before any application implementation. This report does not advance that gate. |
| Arhaan + coordinator | Confirm accessible Vercel account and personal/noncommercial eligibility; verify identity/plan through a working network route. Later configure the specific project and public deployment settings within root's authorized scope. |
| Arhaan + coordinator | Select/access one Supabase project; supply URL and server secret through local/hosting secret storage, never prompts. Confirm private bucket, quotas/region, ownership approach and retention. Creating anything is outside this task. |
| Arhaan + coordinator | Select fal account; obtain an API-capable key through its dashboard and place it privately as `FAL_KEY`; verify model access and credit balance without making the documentation's example generation call. |
| Arhaan | Explicitly approve a numeric generation cap and separate credit-purchase authority if necessary. Suggested reviewable pilot: **USD 2.00 total generation**, 5-second videos only, no automatic recharge; this suggestion is **not approval**. Check the actual top-up minimum before requesting any purchase. Until approved, remain disabled at $0. |
| Coordinator | At D2 align actual code and `.env.example`: proposed `FAL_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `STORAGE_BUCKET`, `APP_BASE_URL`, existing live/budget gates; add public auth configuration only if selected. Replace/map generic `GENERATION_API_KEY` explicitly. `DATABASE_URL` depends on the eventual migration/data-access choice. No env edits made. |
| Backend + verifier, after gates/access/cap | Validate one upload→5 s video and one prompt→image→video on deployment; persist/copy, reload, play, reuse, download; check cross-visitor isolation, duplicate submits, ambiguous timeouts and transfer recovery. Record actual spend and result IDs safely. |

## Verification and capture boundary

Report self-review checked that price arithmetic matches cited units, documentation is never described as live API evidence, credential presence is not treated as account access, and both media types plus durable storage have explicit dependencies. Identified retention/billing wording differences are preserved above. No build, generation, upload, download, playback, database, or deployment test ran; the Vercel authentication attempt failed before an HTTP response.

Real session ID from `CODEX_THREAD_ID`: `01a12d7c-4187-7c51-b9d4-6531b1052c84`. Existing matching destination observed: `.agent-logs/2026-10-12_00-21-21_01a12d7c-4187-7c51-b9d4-6531b1052c84.md`. Logger files untouched. Coordinator must verify this worker's complete prompt/final capture after return; the final response is not yet emitted or self-verified. Only authored path: `docs/recon/integration-preflight.md`.
