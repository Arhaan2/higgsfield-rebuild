# Deployment evidence

Project appgprj_6acc37cbdaf081918ff0bfcc27e4020b; public audience confirmed with get_site. Production URL: https://higgsfield-rebuild.rich-bun-3830.chatgpt.site . No provider key or positive generation allowance is configured.

| Version | Source | Deployment | Observed result |
| --- | --- | --- | --- |
| 1 | 6d5a576832f7704feade88d7f483ab402b924d0c | appgdep_6acc3b777bf88191aed554b79b0d67e3 | Succeeded; first sample shell. |
| 2 | 88b273a4cadfb57d080df1d6f1fd915ed7b756ba | appgdep_6acc469fd70c8191b78ef6dcaade2556 | Failed2026-10-12T02:32:03Z, incomplete input: SQLITE_ERROR. Environment revision1. Not live. |

Version2 archive SHA256:1fd9300b9d28ff13fba7bc8a7f502a256fe4e79da3a9a7f43586934598f532c4. Its full source was also pushed to public GitHub. The build and27 client checks passed; failure occurred in publication, not an application acceptance run.

After failure, the official Sites database overview reported DB with **zero user tables** and no omitted identifiers. Therefore this attempt did not leave the application tables applied. The source migration remains byte-identical to the previously applied local migration: SHA25621d4a37e67febeca325da37fe71f8f74530c568b06f0ca3c68a51115b6e01dd3. It has34 Drizzle statements, seven tables and ten guards.

The hosted runner's internals are unavailable. Naive semicolon splitting reproduces incomplete input at the first trigger; complete Drizzle boundary preparation succeeds. [D1's exec documentation](https://developers.cloudflare.com/d1/worker-api/d1-database/#exec) specifies newline-separated queries. A formatting-only build adapter now emits each complete breakpoint statement on one line, preserving quoted contents, all guard bodies and source/journal files. This is a bounded transport hypothesis, **not yet a proven fix**. No runtime migration endpoint or guard removal was introduced.

`node scripts/check-migration-package.mjs` verifies the immutable source hash,34 individually prepared transport statements, identical normalized SQLite schema, ten triggers, zero budget rows, quoted-content preservation and rejection of multiline literals. TypeScript passes. An actual successful publish plus hosted integration checks is still required.

Root adopted the reviewer’s optional inline-breakpoint layout before retry:34 physical SQL lines, no standalone comment lines. Build completed again, and the immutable source hash and all transport/schema checks pass. Current built transport SHA256:85e876f317d9e2ee15606bb06cf9db62a4070804786a8236a9cf9b28c7b038d8. The reviewer’s report records its earlier inspected layout; this explicit follow-up supersedes only that packaging detail.

## Retry outcome and current boundary

Version3 source e9d66bb7d8f5c83e656afdbffc423779c4d9a9b7, saved version appgprj_6acc37cbdaf081918ff0bfcc27e4020b~appgver_00aa0f77977081918e96e63c533d5dff, deployment appgdep_6acc48eb93248191838f3d52a009d6fd failed2026-10-12T02:41:51Z with the same incomplete-input error, environment revision1. Archive SHA256:b55169ac3e3b42bddedca1e892de44684d6a705d389e1728a198092e41d7fa60. The official DB overview again returned zero user tables. The bounded formatting hypothesis did not resolve the hosted failure; its adapter/check script were removed from current build code, while the reviewed experiment remains in Git history. Source migration and journal are unchanged.

Root verified the migration reviewer's full prompt/final and23-session source audit. Original Sites packaging is restored. Direct Wrangler authentication is absent; the user was asked to sign in. A fresh build and direct Wrangler dry run succeed without uploading:42 additional modules,32 static files,906.78KiB total upload and261.51KiB gzip. Dry run used the local generated bindings and proves packaging only, not resource configuration or remote migration. The public shell and repository remained anonymously accessible at02:46 UTC. No full hosted data-path pass is claimed.
