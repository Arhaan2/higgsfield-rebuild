# Direct deployment review — p3-direct-deployment-review-002

Backend specialist; accountable coordinator: root. Reviewed 2026-10-12 UTC. **No blocking code defect found in the current direct-deployment config or the documented fresh, empty-database procedure.** This is packaging and migration review evidence, not remote deployment success. Accepted gates remain C0/separate CLI capture and D2; R1 advances only under the supplied user exception; V3 remains pending.

## Findings and bounded recommendations

1. **Current config preserves the required deployment behavior.** `scripts/prepare-cloudflare.mjs:21–33` retains `no_bundle`, module rules, compatibility date/flags, `DB`, and `BUCKET`; it resolves the entry point and static directory correctly from the repository. The actual `dist/server/wrangler.json` has only `assets.directory`, no asset binding/custom routing, and no nonempty additional service/resource bindings to lose. Wrangler 4.92.0's installed schema makes `find_additional_modules` default true with `no_bundle`, and `base_dir` default to the entry-point directory. The isolated dry run included all **43 JavaScript files** (entry point plus 42 additional modules), including `ssr/index.js`, and **32 static files**. No missing-module defect was reproduced. These defaults also match [Cloudflare's configuration reference](https://developers.cloudflare.com/workers/wrangler/configuration/#find-additional-modules).

2. **Risk, not a present failure: build-config drift is silently accepted.** The layout guard at `scripts/prepare-cloudflare.mjs:22` checks only `no_bundle` and `main`; line 29 reconstructs `assets` using only its directory. A future generated `assets.binding`, `run_worker_first`, HTML/fallback policy, explicit module base directory, or required additional binding could therefore disappear without rejection. Root may preserve reviewed asset options while rebasing their directory and add rejection of unsupported nonempty deployment fields. Do not blindly copy local placeholder resource IDs. No such dropped requirement exists in the inspected build.

3. **The initial SQL is valid and deliberately not replayable; one-time application remains an operational requirement.** `docs/DEPLOY-CLOUDFLARE.md:13–17` explicitly requires account/name collision checks, an empty intended database, and state inspection before retry. This is a safe stated boundary. `d1 execute --file` does not itself establish the normal migration ledger: the unchanged SQL contains no ledger or idempotency guard. An in-memory first application created seven tables, 23 indexes including automatic indexes, and all ten triggers; policy rows were zero and `foreign_key_check` was clean. Replay failed immediately with `table assets already exists`. All ten trigger bodies individually match `src/server/schema-guards.sql` byte-for-byte.

   Root should make the runbook executable before the remote write: record the actual account/database UUID and migration SHA-256; inspect `sqlite_schema` in that exact database before applying; stop if application objects already exist; after application record table/trigger names and definitions plus zero policy rows. Preserve the original SQL and guards. On ambiguous completion, inspect before retrying. Before future schema changes, choose a migration ledger and explicitly baseline this initial application rather than switching runners and replaying it. [Cloudflare's migration guidance](https://developers.cloudflare.com/d1/reference/migrations/) describes `d1_migrations` tracking and recommends considering database names to reduce binding-selection mistakes.

## Actual checks

Disposable fixture: `/tmp/higgsfield-p3-direct-review-i0zc8xgt/`. The preparation script and build were copied there; invented, nonsecret fixture identifiers were used. The real `.cache/cloudflare` destination was not touched.

| Check | Observed result / evidence |
| --- | --- |
| Installed CLI/schema | Wrangler **4.92.0**; inspected `config-schema.json` and `deploy --help` / `d1 execute --help`. Fixture `version.txt`, `deploy-help.txt`, `d1-help.txt`. |
| Actual preparation script + dry run | Exit 0. All 43 JS files present in dry-run output; 42 additional modules, 32 assets, **906.78 KiB / 261.51 KiB gzip**. `dry-run.txt` and `dry-run/`. No upload/deployment. |
| Required policy/bindings | Generated config has `DB`, `BUCKET`, exact fixture HTTPS origin, string `false` live flag, string `0` cap, and no provider key. `src/config/server.ts:3–13` reads these names and denies invalid origin/configuration. |
| Origin validation | HTTP, non-root path, credentials, query, and fragment each rejected; plain HTTPS origin accepted. `origin-validation.json`. |
| Immutable migration | Whole-script SQLite application passes with foreign keys enabled; replay fails as expected. Seven tables/ten triggers/zero budget-policy rows; `sqlite-evidence.json`, `guard-evidence.json`. This does not repeat the prior broad trigger behavior suite. |
| Isolated Wrangler local D1 | **Unverified:** first application, inspection, and replay attempts each exited 1 with `listen EPERM: operation not permitted 127.0.0.1` before a SQL result. `migration-first.txt`, `migration-verify.txt`, `migration-replay.txt`. Environment restriction, not a demonstrated SQL defect. Root's earlier local D1 pass is supplied evidence, not independently reproduced here. |

Inspected `scripts/sites-env.mjs`, `build/sites-worker.ts`, Sites build packaging, `db/index.ts`, schema/guards, server configuration, and `scripts/verify-http.mjs`. No `worker/index.ts` exists. The Sites wrapper's production connector context is optional; the current config has no required connector service binding. The HTTP verifier checks disabled/zero policy before writes, then actual persistence and ownership boundaries; it was not run against any host in this review.

Reviewed SHA-256 values:

| Source | SHA-256 |
| --- | --- |
| `scripts/prepare-cloudflare.mjs` | `13f21eba2f4c08505d8ee69850914321ff5cb40eb1014d2af096a5088d1712cb` |
| `dist/server/wrangler.json` | `e6d4e4561517d52837d2b0ea8f86b936ff462e564d22bf099087b06f6f914739` |
| `drizzle/0000_cute_daredevil.sql` | `21d4a37e67febeca325da37fe71f8f74530c568b06f0ca3c68a51115b6e01dd3` |
| `docs/DEPLOY-CLOUDFLARE.md` | `da3e78005a9370ff02082d51078913f01f0f2f01d817542ff3ba3781f6570fe0` |

## Hosted prerequisites and capture

The reported 02:56 UTC unauthenticated `whoami` is an input, not rechecked here. Root still owns authenticated account selection, resource collision/ownership and entitlement checks, actual D1/R2 identifiers, verified Worker hostname, empty remote schema inspection, migration, publication, and hosted HTTP/browser evidence. A custom HTTPS origin alone does not configure DNS/routes: the helper supplies neither; root must use the actual workers.dev URL or separately configure a reviewed domain route. Public reachability and exact `APP_ORIGIN` agreement remain required. Provider configuration and explicit spending authorization are still absent; live generation stays false with cap zero.

Automatic capture session: `01a12e0a-b081-7c72-a444-8ce4737e5158`; actual recorded model: `gpt-6-astra`; destination: `.agent-logs/2026-10-12_02-56-55_01a12e0a-b081-7c72-a444-8ce4737e5158.md`. The complete task from `docs/agents/handoffs/14-direct-deployment-review.txt` is present automatically; trimmed prompt SHA-256: `ff6c2a86d516f518c000afb8a4191083bd177527ee94ae5a654b10a250195b3e`. Final-response coverage remains unresolved until root checks after emission.

Only this report and disposable probe files were written. No capture edits, application/configuration repairs, installs, persistent project database writes, credential access, browser activity, delegation, Git operations, provisioning, deployment, provider requests, or billable actions. Recommendations above are root-owned and unapplied.
