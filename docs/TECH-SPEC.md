# Accepted technical contract v1

Coordinator decision, 2026-10-12 01:35 UTC. Specification accepted; current runtime evidence is summarized below. Adopt [architecture](architecture/decision.md) and [API contract](architecture/api-contract.md) with the explicit amendments below. Shared source types in `src/contracts/studio.ts` are authoritative.

**Implementation checkpoint, 2026-10-12:** the accepted contract is now implemented at the repository root and locally built/typechecked. The historical provisioning plan below describes the D2 decision. Current hosting evidence supersedes it: Sites version1 is a public sample shell; integrated versions2/3 failed migration processing. Direct Cloudflare login and the initial D1 schema are verified; R2 is not enabled and no Worker is published. See DEPLOY-CLOUDFLARE.md and verification/deployment.md. The initial direct D1 migration has already been applied once and must not be replayed.

Explore provides the three accepted presets; Studio supports separate image/video draft buffers, explicit save acknowledgements, reference upload and immutable job inspection; Library opens saved guest projects with samples separated. Sample-image animation handoff and Library/reload are browser-verified locally. Real prompt→image→video remains unrun. A dedicated tests/visual harness, if used, is local-only, renders production components with labeled fixture state, and is excluded from the product routes and deployment.

## Stack and location

Use the actual Sites Vinext starter: React 19.2.6, Vinext 1.0.0-beta.5, Next-compatible routes, TypeScript 5.9.3, Drizzle 0.45.2, Vite 8.0.13 and Wrangler 4.92.0; npm lockfile owns the dependency graph. Node 24.18.0/npm 11.16.0 are present. Installation, TypeScript and production build are verified; real provider compatibility remains unrun.

The application lives at the **existing repository root**, not the architect's proposed `sites/studio/`. The official empty-directory setup was prepared under ignored `.cache/vinext-seed`; root merges its files while preserving capture, docs, Git and existing configuration. This honors the user's fixed capture destination. No nested repository or worktree. Keep the supplied `sites()` integration and platform auth helper.

Sites project `appgprj_6acc37cbdaf081918ff0bfcc27e4020b` was created once, persisted in `.openai/hosting.json`, and public access was explicitly configured (revision 2). Expected URL: https://higgsfield-rebuild.rich-bun-3830.chatgpt.site . The first sample-shell deployment exists at Sites version1/source6d5a576. Integrated versions2/3 failed migration processing. The existing public GitHub origin remains authoritative. Logical bindings remain D1 `DB` and private R2 `BUCKET`; current direct Cloudflare provisioning is recorded in DEPLOY-CLOUDFLARE.md.

## Interfaces and behavior

Adopt the documented guest cookie, Origin checks, request bounds, owner predicates, revision conflicts, raw JPEG/PNG uploads, immutable snapshots, request keys, admission limits, unknown-submission handling and transfer recovery. The server must validate each boundary. No live provider request is allowed under the current zero-spend policy.

Amendments: each Draft and Snapshot also has `parentAssetId: string | null`, validated as an owned or public sample asset, so a revision retains its source. Asset adds title, optional poster and attribution for presentation. Root published the exact types and validation schemas before implementation. Preset IDs are validated against root's catalog. Samples are immutable root-authored catalog entries with files under `public/samples/`; they may use same-origin static media/download URLs and do not require R2 seeding. Private media remains in R2. Samples have no invented generation metadata. The displayed still and clip are distinct works, not a claimed image-to-video pair.

Retain drafts server-side in D1. Guest access lasts at most 30 days on this browser; cookie loss/expiry loses access. A browser recovery buffer may supplement server saves but never establishes Saved status. Library lists actual projects. Reuse fills a draft, never silently submits or alters an existing result.

## Live-generation policy

Exact proposed environment names are adopted: `APP_ORIGIN`, `LIVE_GENERATION_ENABLED`, `GENERATION_BUDGET_USD`, `FAL_KEY`. Flag false, environment cap zero and D1 policy absent/zero all deny new generation. A key alone cannot enable it. Endpoints are `fal-ai/flux/schnell` and `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` with the strict fixed payloads in the architecture contract. Reservations are conservative admission limits, not billed-price claims. No cap is authorized today.

The adapter is request-driven: closing all browser tabs pauses reconciliation. Unknown POST outcomes retain the reservation and never auto-resubmit. Provider success is not app success until retained media exists. Separate transfer retry must never regenerate. Provider compatibility, billing and real results require future authorized deployed checks.

## Ownership

Root owns shared contracts/catalog, layout, manifests/lockfiles, build/config/env, public media, migration generation/application, integration, capture, commits and deployment. Backend is explicitly assigned `src/server/**`, `app/api/**`, `tests/server/**` and **`db/schema.ts`**; root retains `db/index.ts` and `drizzle/**`. Frontend owns `components/studio/**`, `src/client/**`, `app/page.tsx`, `app/studio/**`, `app/library/**`. Designer owns `app/globals.css` and `styles/**` only, consuming the agreed class contract. Each receives a complete handoff before coding. No concurrent edits across these boundaries.

## Verification and honest gates

Build/typecheck and targeted tests cover ownership, Origin, upload validation, atomic budget/storage admission, duplicate/unknown submission, and range delivery. Browser checks cover sample labels, save/reload, invalid upload recovery, reuse, playback/download and responsive keyboard behavior. Mocked provider tests are labeled as such. V3 remains pending without a real deployed generation; public access and D1/R2 behavior are not inferred from Site registration.
