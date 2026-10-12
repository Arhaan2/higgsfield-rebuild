# Direct Cloudflare deployment preparation

Not deployed or provisioned. The existing Sites public shell remains available. Sites versions2 and3 failed while applying the complete migration; DB was empty after both. A formatting-only packaging experiment did not resolve the error and was removed from current build code. Its evidence and original commits remain in docs/verification/deployment.md.

The existing application already builds to a Cloudflare Worker with DB and BUCKET bindings. Direct Wrangler execution successfully applied the complete, unchanged migration to local D1. Remote success is still unverified. Read current [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) and [D1 migration guidance](https://developers.cloudflare.com/d1/reference/migrations/) before the remote operation.

## Immediate user action

From the actual repository terminal, run `npx wrangler login` and complete the Cloudflare browser sign-in. Report only that it succeeded; do not paste credentials. This authorizes no generation spending. The coordinator must verify the actual account, inspect any name collisions and preserve existing resources. No Cloudflare account or new resource was created during preparation.

## Coordinator sequence after authentication

1. Verify account access with `wrangler whoami`. If multiple accounts are available, resolve the intended account before provisioning. Inspect existing Workers/D1/R2 names; do not overwrite another application. Use only available account entitlements; request a concrete decision if a billable prerequisite appears.
2. Prepare or select the assignment's actual D1 database and private R2 bucket. Record their real IDs and the chosen account. The application database policy starts at zero; do not seed a positive budget.
3. Build with `npm run build`. `node scripts/prepare-cloudflare.mjs --help` lists the required real identifiers and verified HTTPS origin; it writes an ignored deployment config and never provisions or publishes. The origin must match the eventual public Worker URL. Preserve the starter's tested compatibility date unless a separately tested runtime update is necessary.
4. With the complete config, use `wrangler deploy --dry-run --config .cache/cloudflare/wrangler.json`. Inspect the upload/module/asset plan. Apply the original migration once to the intended empty remote database using `wrangler d1 execute DB --remote --config .cache/cloudflare/wrangler.json --file drizzle/0000_cute_daredevil.sql`. Resolve uncertain migration state before retrying. Never replay it against an existing schema.
5. Verify the seven tables and ten guards, then publish the exact reviewed build with `wrangler deploy --config .cache/cloudflare/wrangler.json`. Confirm the actual returned URL and APP_ORIGIN agree; do not advertise a working data path until they do.
6. Run `node scripts/verify-http.mjs ACTUAL_PUBLIC_ORIGIN docs/verification/deployed-http-integration.json`, then the browser upload/save/reload/library/sample/download checks. Update all public links and source/deployment evidence together. Real generated-video acceptance remains pending without private FAL_KEY configuration and an explicit bounded allowance.

These commands are a prepared sequence, not evidence of execution. Use the repository's installed Wrangler through `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js` when project-local runtime/log settings are needed. Source capture remains in this same repository; no worktree or capture destination change is required.
