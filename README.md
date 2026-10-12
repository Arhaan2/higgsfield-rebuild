# Frame Studio · Higgsfield rebuild

A focused creative studio for the 8x assignment. Explore a prompt direction, compose a shot, retain its inputs, and inspect related work.

**Current checkpoint:** Explore, Studio, Library, private uploads, and saved guest drafts are implemented. The full application works locally. The first public shell remains live because two integrated publishes failed in the hosting migration runner. Direct Cloudflare sign-in and the remote database migration now succeed; R2 enablement is the remaining hosting prerequisite. Live generation is disabled with a zero spending allowance; no deployed generation is claimed.

- [Live application](https://higgsfield-rebuild.rich-bun-3830.chatgpt.site)
- [Public source](https://github.com/Arhaan2/higgsfield-rebuild)
- [Current evidence and phase status](docs/STATUS.md)
- Camera-on walkthrough: **not recorded**; [4:30 preparation script](docs/WALKTHROUGH-SCRIPT.md).

## Product choices

[Signed-in research](docs/RECON.md) found useful prompt reuse and draft continuity, as well as a displayed-free flow with a paid fallback warning. The rebuild focuses on consistent task/model/action labels, visible start-frame semantics, retained inputs, and a server-enforced spending boundary. History and reuse already exist in Higgsfield; our proposed improvement is clearer local context, not invention of those features.

The user explicitly allowed implementation with the documented research gaps unverified. [Design decisions](docs/DESIGN-BRIEF.md) apply the installed Apple Design skill to a charcoal, ivory and brass cinematic workspace.

## Current verification

The first public shell is source `6d5a576832f7704feade88d7f483ab402b924d0c`, Sites version 1. Build and TypeScript checks pass. An unauthenticated HTTP request and browser navigation reach the labeled sample. Its actual 14.996667-second clip plays. Direct browser retrieval downloads an 11,342,355-byte MP4 with the source checksum; the ordinary click's download event timed out and remains unverified. The integrated editor/data path is verified locally, not on this public shell. Two integrated publish attempts failed; see [deployment evidence](docs/verification/deployment.md) and the prepared [direct Cloudflare route](docs/DEPLOY-CLOUDFLARE.md). No real AI generation is claimed.

## Run locally

Use Node 24.18 or newer for the included isolated test tooling, and npm. The app uses the supplied Sites Vinext starter, React/TypeScript, D1 and private R2. Exact dependency versions are in package-lock.json.

```sh
npm run install:ci
cp .env.example .env.local
npm run dev
```

Preview: http://127.0.0.1:5173 . On a new checkout, build once and apply the initial local migration once before saving drafts:

```sh
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_cute_daredevil.sql
```

Do not replay an applied migration or alter migration history. D1 has seven tables and ten guards; no positive budget policy is seeded. Local and hosted state are separate. Sites applies hosted migrations during publication.

```sh
npx tsc --noEmit
npm run build
node --import ./tests/server/register.mjs --test tests/server/*.test.mjs
node src/client/checks/studio-state.mjs
node src/client/checks/library-state.mjs
node src/client/checks/reference-action.mjs
```

The 36 server checks use isolated SQLite and mocked R2/provider calls; 44 Studio, 6 Library and 18 reference-action checks use mocked APIs/hooks. Eleven actual local HTTP checks and browser upload/save/reload checks also pass; see [local evidence](docs/verification/local-browser.md) and [Phase 3 continuation](docs/verification/phase3-continuation.md). The continuation verifies ordinary sample/private download clicks and repairs a stale save notice. These checks do not prove real generation. `node scripts/verify-http.mjs http://127.0.0.1:5173` runs the actual zero-spend HTTP checks and creates isolated guest test records. This script refuses to continue if public live policy is enabled or has a nonzero cap.

`APP_ORIGIN` must exactly match the browser origin. `LIVE_GENERATION_ENABLED=false` and `GENERATION_BUDGET_USD=0` are the defaults. `FAL_KEY` is optional and server-only; a key alone does not enable generation. D1's separate budget policy also defaults to no allowance. Do not put populated secrets in tracked files or chat.

## Scope and limitations

The implementation target includes validated JPEG/PNG start frames, same-browser guest drafts, immutable media, connected reuse and two fixed fal models: FLUX schnell images and Kling 2.5 Turbo Pro five-second videos. Provider submission/retrieval, billing, and real deployed generation remain unverified and require private provider configuration plus explicit bounded authorization. Unknown submission outcomes must not auto-resubmit. Request-driven reconciliation pauses when every browser tab closes.

Guests are private per browser cookie, with access for up to 30 days; this is not cross-device account synchronization. There is no billing UI, collaboration suite, node editor, or broad Higgsfield feature/model parity.

[Dune study media](docs/design/sample-provenance.md) is licensed prepared photography and independent stock footage. It was not created from the example prompt or generated by this application. Samples never stand in for a live result.

## Capture and delivery

[CAPTURE-TEST.md](CAPTURE-TEST.md) records actual independent canaries. Desktop and separate CLI specialist sessions are automatically captured in tracked `.agent-logs/`; native children and worktrees remain unverified and unused for production. [Capture operation](docs/capture/README.md) explains provenance and the read-only audit.

```sh
PYTHONDONTWRITEBYTECODE=1 python3 scripts/capture/verify.py
```

[Workflow](docs/WORKFLOW.md), [decisions](docs/DECISIONS.md), [acceptance](docs/ACCEPTANCE.md) and [specialist contracts](docs/agents/ASSIGNMENTS.md) preserve the incremental evidence. Final public access, the actual creation-path gate, and Arhaan's camera-on walkthrough under five minutes remain delivery requirements.

Phase 4–6 local review repaired failure-storage reservations, cross-shot metadata, Library preview recovery and movement-text preservation. [Integration evidence](docs/verification/phase456-integration.md) separates actual browser/HTTP checks from [isolated UI fixtures](docs/verification/state-fixture-guide.md). The public Studio deep link still returns404; release acceptance remains pending. All generation spending stays disabled.
