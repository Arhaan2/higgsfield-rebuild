# Direct Cloudflare deployment preparation

Worker not deployed yet. Direct Cloudflare D1 is now provisioned and its initial migration is applied; R2 enablement remains pending. The existing Sites public shell remains available. Sites versions2 and3 failed while applying the complete migration; DB was empty after both. A formatting-only packaging experiment did not resolve the error and was removed from current build code. Its evidence and original commits remain in docs/verification/deployment.md.

The application builds to a Cloudflare Worker with DB and BUCKET bindings. Direct Wrangler execution successfully applied the complete, unchanged migration to local D1 and now the verified remote assignment database. Root read current [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) and [D1 migration guidance](https://developers.cloudflare.com/d1/reference/migrations/) before the remote operation.

## Immediate user action

Cloudflare login is complete. Enable R2 in the authenticated account's Cloudflare dashboard, completing any billing details or terms personally, and report only “R2 enabled.” The R2 API returned error10042 requiring enablement. This authorizes no generation spending; all generation policy remains disabled.

## Actual remote state — 2026-10-12 03:04 UTC

- One authenticated account verified; existing unrelated D1 preserved. `higgsfield-rebuild` Worker name absent; official subdomain API returned `arhaan2`, giving intended origin `https://higgsfield-rebuild.arhaan2.workers.dev` (not published yet).
- D1 `higgsfield-rebuild`, UUID `3eb2d881-1c6d-4d61-8ff8-de5c711c5562`, created in WNAM. Preflight found only `_cf_KV`, no application objects.
- Original `drizzle/0000_cute_daredevil.sql` applied **once**,34 statements. SHA256 `21d4a37e67febeca325da37fe71f8f74530c568b06f0ca3c68a51115b6e01dd3`. Remote7 tables/10 trigger definitions match source; foreign-key check empty, budget policy rows0. See verification/cloudflare-initial-migration.json and cloudflare-schema.json.
- **Do not replay this migration.** Direct `d1 execute --file` did not create a normal migration ledger. Before any subsequent schema migration, select a ledger and explicitly baseline this initial application.

## Coordinator sequence after R2 enablement

1. Verify account access with `wrangler whoami`. If multiple accounts are available, resolve the intended account before provisioning. Inspect existing Workers/D1/R2 names; do not overwrite another application. Use only available account entitlements; request a concrete decision if a billable prerequisite appears.
2. Reuse the verified D1 above; inspect and create the assignment's private R2 bucket without collisions. Record actual IDs and account. Do not seed a positive budget.
3. Build with `npm run build`. `node scripts/prepare-cloudflare.mjs --help` lists the required real identifiers and verified HTTPS origin; it writes an ignored deployment config and never provisions or publishes. The origin must match the eventual public Worker URL. Preserve the starter's tested compatibility date unless a separately tested runtime update is necessary.
4. With the complete config, use `wrangler deploy --dry-run --config .cache/cloudflare/wrangler.json`. Inspect the upload/module/asset plan. The migration is already applied and verified; **do not execute it again**. If a different database is proposed, verify its ownership and schema and record that decision first.
5. Verify the seven tables and ten guards, then publish the exact reviewed build with `wrangler deploy --config .cache/cloudflare/wrangler.json`. Confirm the actual returned URL and APP_ORIGIN agree; do not advertise a working data path until they do.
6. Run `node scripts/verify-http.mjs ACTUAL_PUBLIC_ORIGIN docs/verification/deployed-http-integration.json`, then the browser upload/save/reload/library/sample/download checks. Update all public links and source/deployment evidence together. Real generated-video acceptance remains pending without private FAL_KEY configuration and an explicit bounded allowance.

Remaining publication commands are a prepared sequence, not evidence of deployment. Use the repository's installed Wrangler through `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js` when project-local runtime/log settings are needed. Source capture remains in this same repository; no worktree or capture destination change is required.
