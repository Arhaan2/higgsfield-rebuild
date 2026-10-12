# Direct Cloudflare deployment preparation

**Published successfully on 2026-10-12 at 18:51 UTC.** Use https://higgsfield-rebuild.arhaan2.workers.dev. Exact source f271258fd0d4fece10229dfd74c89dfd5bcf275f (reviewed product b32b03e) is Worker version cbe42062-203d-462c-949e-0d4bd380beac, tag f271258. The user enabled R2; root verified availability, created the private assignment bucket, built, inspected a dry run and deployed with the existing verified D1. **No migration replay.**

Actual bindings: DB = 3eb2d881-1c6d-4d61-8ff8-de5c711c5562; BUCKET = higgsfield-rebuild; APP_ORIGIN = https://higgsfield-rebuild.arhaan2.workers.dev; LIVE_GENERATION_ENABLED=false; GENERATION_BUDGET_USD=0; no provider-secret binding. Metadata: [deployed-cloudflare.json](verification/deployed-cloudflare.json). Root's 11 hosted HTTP checks and Reviewer's 20 independent checks pass; [browser evidence](verification/deployed-browser.md) records the actual interaction path.

No new resource or access action is required from Arhaan for the deployed studio. Billing activation/upgrades were not performed by the agent. R2 included usage is not a hard account-wide spending cap. The account's existing entitlement is used; no provider request or positive budget was authorized.

The original Sites shell and failed integrated publishes remain historical. The following preparation/preflight record explains the direct route and must not be mistaken for the current deployment state.

The application builds to a Cloudflare Worker with DB and BUCKET bindings. Direct Wrangler execution successfully applied the complete, unchanged migration to local D1 and now the verified remote assignment database. Root read current [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) and [D1 migration guidance](https://developers.cloudflare.com/d1/reference/migrations/) before the remote operation.

## Historical user-owned activation prerequisite — resolved

At the earlier checkpoint, Cloudflare login was complete but R2 returned error10042. Arhaan needed to personally enable R2 and report “R2 enabled.” That action is now resolved by the user and the successful availability check above. It authorized no generation spending.

The user subsequently reaffirmed **$0 total spending** while choosing R2. A fresh check still returned10042. [Cloudflare's setup guide](https://developers.cloudflare.com/r2/get-started/) requires subscription checkout for activation. [R2 pricing](https://developers.cloudflare.com/r2/pricing/) includes10 GB-month Standard storage,1 million Class A and10 million Class B operations monthly; usage above these amounts is billed. Do not represent the free allowance as a hard $0 spending cap, activate paid upgrades, or approve overage charges. No billing settings were changed. Activation was a user-owned prerequisite, subsequently completed as recorded above.

## Actual remote state — 2026-10-12 03:04 UTC

- One authenticated account verified; existing unrelated D1 preserved. `higgsfield-rebuild` Worker name absent; official subdomain API returned `arhaan2`, giving intended origin `https://higgsfield-rebuild.arhaan2.workers.dev` (not published yet).
- D1 `higgsfield-rebuild`, UUID `3eb2d881-1c6d-4d61-8ff8-de5c711c5562`, created in WNAM. Preflight found only `_cf_KV`, no application objects.
- Original `drizzle/0000_cute_daredevil.sql` applied **once**,34 statements. SHA256 `21d4a37e67febeca325da37fe71f8f74530c568b06f0ca3c68a51115b6e01dd3`. Remote7 tables/10 trigger definitions match source; foreign-key check empty, budget policy rows0. See verification/cloudflare-initial-migration.json and cloudflare-schema.json.
- **Do not replay this migration.** Direct `d1 execute --file` did not create a normal migration ledger. Before any subsequent schema migration, select a ledger and explicitly baseline this initial application.

## Deployment sequence — executed, retained for reproducibility

1. Verify account access with `wrangler whoami`. If multiple accounts are available, resolve the intended account before provisioning. Inspect existing Workers/D1/R2 names; do not overwrite another application. Use only available account entitlements; request a concrete decision if a billable prerequisite appears.
2. Reuse the verified D1 above; inspect and create the assignment's private R2 bucket without collisions. Record actual IDs and account. Do not seed a positive budget.
3. Build with `npm run build`. `node scripts/prepare-cloudflare.mjs --help` lists the required real identifiers and verified HTTPS origin; it writes an ignored deployment config and never provisions or publishes. The origin must match the eventual public Worker URL. Preserve the starter's tested compatibility date unless a separately tested runtime update is necessary.
4. With the complete config, use `wrangler deploy --dry-run --config .cache/cloudflare/wrangler.json`. Inspect the upload/module/asset plan. The migration is already applied and verified; **do not execute it again**. If a different database is proposed, verify its ownership and schema and record that decision first.
5. Verify the seven tables and ten guards, then publish the exact reviewed build with `wrangler deploy --config .cache/cloudflare/wrangler.json`. Confirm the actual returned URL and APP_ORIGIN agree; do not advertise a working data path until they do.
6. Run `node scripts/verify-http.mjs ACTUAL_PUBLIC_ORIGIN docs/verification/deployed-http-integration.json`, then the browser upload/save/reload/library/sample/download checks. Update all public links and source/deployment evidence together. Real generated-video acceptance remains pending without private FAL_KEY configuration and an explicit bounded allowance.

This sequence was executed in the successful deployment above. Evidence is in the deployment, HTTP and browser records. Use the repository's installed Wrangler through `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js` when project-local runtime/log settings are needed. Source capture remains in this same repository; no worktree or capture destination change is required.

## Submission continuation preflight — 2026-10-12 04:36 UTC

Fresh authentication confirms the same account. R2 bucket listing still fails with 10042; the intended Worker deployment list fails with 10007 (Worker absent). Read-only D1 inspection finds the exact previously verified seven tables/ten guards, no foreign-key violations and zero budget-policy rows. The initial migration was not replayed. A first bare-UUID CLI lookup was rejected locally; the successful retry used an explicit verified DB binding. Evidence: verification/submission-resource-preflight.json.

Anonymous entry remains the sample shell (200); Studio and Library each return 404. Fresh Sites metadata confirms only version 1 succeeded, at source 6d5a576; versions 2/3 remain failed. No later deployment is being overwritten. Evidence: verification/submission-public-preflight.json and submission-sites-preflight.json. Cloudflare's current R2 setup/pricing pages still require user-owned subscription checkout and distinguish included usage from billed overages. No activation, billing change or bucket creation was attempted.

The prepared deployment config is generated after a fresh build with verified identifiers. Its absence on disk is not a deployment failure or missing source; scripts/prepare-cloudflare.mjs is authoritative. Wait for actual R2 availability before writing a config that claims a real bucket.
