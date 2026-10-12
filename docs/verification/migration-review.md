# Migration packaging review — p3-migration-review-001

Backend review, 2026-10-12 UTC. Accountable coordinator: root. **The formatting repair preserves this migration's SQL semantics in isolated SQLite tests; the hosted failure mechanism remains unconfirmed.** No deployment or phase gate is advanced by this report. C0/separate CLI capture and D2 are accepted inputs; R1 remains the user exception, V3 pending, live spend zero.

## Failure diagnosis

The assignment reports that Sites version 2, deployment `appgdep_6acc469fd70c8191b78ef6dcaade2556`, built from `88b273a4cadfb57d080df1d6f1fd915ed7b756ba`, failed with `incomplete input: SQLITE_ERROR`; root's database overview found zero user tables. These hosted observations were supplied by root, not independently queried here. Zero tables proves no persisted application schema at that observation, but does not distinguish failure before the first statement from transaction rollback.

Independent Python SQLite 3.50.1 probes reproduced two different causes of the same message:

- Splitting the source at newlines fails on part 1, `CREATE TABLE assets (`: zero tables created.
- Splitting at semicolons fails on part 25, the first `guests_quota` trigger: seven tables exist in this deliberately nontransactional probe. Flattening statements **does not fix** this splitter.

The intact SQL succeeds as one script and as 34 separately executed Drizzle breakpoint groups, with foreign keys enabled. No other syntax defect was found: all table/index declarations, forward foreign-key references, JSON checks, and ten complete trigger bodies compile. A hosted runtime/version difference or another truncation path remains possible. The assignment's D1 newline-transport documentation is a plausible lead, not evidence of Sites runner internals; no browser or remote access was used.

## Exact inputs

SHA-256 values below bind this review to the inspected bytes. Migration, schema, guards, backend tests, and test harness matched the stated Git commit. Root edited packaging concurrently; those newer files are separately identified.

| File | SHA-256 |
|---|---|
| `drizzle/0000_cute_daredevil.sql` | `21d4a37e67febeca325da37fe71f8f74530c568b06f0ca3c68a51115b6e01dd3` |
| `db/schema.ts` | `036ea4e5fe63b55dcba9e4716433942aeeb1642d0d24de336c08c5947db7243b` |
| `src/server/schema-guards.sql` | `c99266ebca45a7c4c24d848924c283c41919b6ec524615999ce82d17fa41585c` |
| `tests/server/backend.test.mjs` | `e3e823f614ad9a9f829535d4ceb3ddeefc1f3089169e1449fac4ff7af07728ee` |
| `tests/server/harness.mjs` | `eae233c4fefd1a7bb1c86b3fd67a59767fc82c17be0ff9a4a6978e3d8914ff19` |
| `build/sites-vite-plugin.ts`, stated commit | `07af20e7097d9ed1d76f7c446d02997550b8fc5ca89668b249e25eabd62c6834` |
| `build/sites-vite-plugin.ts`, root's concurrent repair | `b83c6e509cd4256d20525efd8947edc28a919dd5878d947d1763ea7ecac6f47b` |
| `build/migration-transport.mjs`, initial reviewed repair | `e59ef7f6fa3466367c632b334346472313378cd07db8a7575967ff428cdda673` |
| `build/migration-transport.mjs`, final reviewed repair (02:40 UTC) | `f54665901391cb1f13be424c910af33eccdc8f4d6813b34dca5182d5bb17f03c` |

## Observed checks and repair assessment

- In-memory whole-script, breakpoint, and flattened execution produced identical tokenized `sqlite_master` definitions: **7 tables, 17 declared indexes (23 including automatic indexes), 10 triggers**. All 34 source groups were complete SQLite statements. All ten guard bodies occur byte-identically in the source migration.
- Independently exercised every trigger in original-group and flattened fixtures: guest/project quotas, reservation invalid state and quota, immutable reservation/job/asset rejection, missing-reservation rejection, job-created reservation, asset settlement, and job rejection with both absent and explicit-zero budget. Both runs passed; `foreign_key_check` was clean. Positive budget values existed only in disposable in-memory fixtures. No provider was called.
- Invoked root's actual `migrationTransport` in Node. Initial output SHA-256 was `df3202b1ad6eb862865d325e1f1e333d37903e41159c96035f415736e019ad6f`; final reviewed output was `85e876f317d9e2ee15606bb06cf9db62a4070804786a8236a9cf9b28c7b038d8`. For both versions, all 34 token streams, including quoted tokens, matched the source; all ten triggers survived; transformation was idempotent. Node SQLite whole-output, breakpoint, and physical-line execution matched the source schema and passed `foreign_key_check`.
- The packaging diff writes only copied `dist/.openai/drizzle/*.sql`; source SQL and journal are not rewritten. This is safe for the inspected SQL. The transformer rejects multiline quoted content/unclosed quotes or block comments. Its initial textual breakpoint split is not a general SQL parser: future literals containing that marker require explicit review. Preserve deterministic artifact formatting, because installed Drizzle hashes the full migration file and transformed bytes differ from locally applied bytes.
- Existing backend tests build their schema from Drizzle declarations plus `schema-guards.sql`; they do **not** test the packaged migration or hosted runner. This review ran focused independent probes, not the full backend suite or Wrangler.

## Supported alternatives and remaining dependency

The initial repair produced 34 SQL lines and 33 standalone breakpoint-comment lines. An independently tested alternative placed each separator after its SQL statement, preserving Drizzle boundaries while ensuring every nonempty physical line starts with executable SQL. **Root's final reviewed repair now uses this placement**, joining flattened statements with `'--> statement-breakpoint\n'`; its 34-line output passed the checks above. This avoids depending on hosted handling of comment-only queries, but still cannot repair a semicolon splitter.

If Sites actually splits on semicolons, a runner repair must submit each complete breakpoint statement to one D1 `prepare()` and combine them with `batch()`. This is supported by the installed Sites storage reference and Drizzle 0.45.2 D1 migrator. Installed Wrangler 4.92.0 also contains a compound-aware splitter (`wrangler-dist/cli.js`, `splitSqlIntoStatements`) that tracks `BEGIN`/`CASE`/`END`, explaining why local Wrangler success does not test a naive hosted splitter. Neither route grants access to change Sites internals. Do not remove guards or add runtime schema endpoints.

Root must verify the final built/package hashes, deploy through the existing Sites workflow, then inspect successful migration state and all seven tables/ten triggers. Deployment success would establish repair efficacy; without runner evidence it still would not uniquely prove which internal splitter caused version 2's failure. Preserve source SQL, metadata, local migration history, and zero-spend configuration.

## Capture and scope

Read `AGENTS.md`, TEAM/BACKEND briefs, handoff template, installed Sites `storage.md`/`troubleshooting.md`, relevant schema/tests, packaging code, and Cloudflare/D1 references. Automatically generated capture: session `01a12df6-8430-7962-8c6a-d17a3b64638a`, actual model `gpt-6-astra`, destination `.agent-logs/2026-10-12_02-34-54_01a12df6-8430-7962-8c6a-d17a3b64638a.md`. Full captured prompt exactly matched `docs/agents/handoffs/13-migration-review.txt` after trimming outer whitespace; prompt SHA-256 `770631dc990c4a3332a4910f272dce7a9f68dc0240899526439fc0d9b46cb910`. Root must verify the final response after emission; no final capture is claimed here.

Only this report was written. No log edits, source changes, installs, browser actions, private credential access, persistent database writes, delegation, worktrees, Git mutations, deployment, or spending.
