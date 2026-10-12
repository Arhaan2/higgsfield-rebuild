# Backend integration — p3-backend-001

Implementation is ready for coordinator integration. No shared source/interface changes are requested. Backend wrote only `db/schema.ts`, `src/server/**`, `app/api/[...path]/route.ts`, and `tests/server/**`. Root's supplied Sites integration, config, dependencies, DB helper, and migrations remain untouched.

## Exact root actions

1. Generate the first migration from `db/schema.ts` with root's `npm run db:generate`. Before applying it, append **all 10 CREATE TRIGGER statements in `src/server/schema-guards.sql`**, placing a Drizzle `--> statement-breakpoint` between complete trigger statements. Do not split the trigger's BEGIN/END body. These guards are required for atomic caps, storage reservations, and immutable snapshots/assets. No seed DML is needed. The missing budget row intentionally denies generation.
2. Apply/review the migration through the supported starter flow; then verify actual DB/BUCKET bindings, cookie persistence, reload, raw uploads, isolation, and ranges in root's preview/browser sessions. Set `APP_ORIGIN` to the exact preview origin for local writes. Keep `LIVE_GENERATION_ENABLED=false` and `GENERATION_BUDGET_USD=0` for publication. Do not seed a positive DB cap or submit a live job.
3. Run `node --import ./tests/server/register.mjs --test tests/server/*.test.mjs`, `npx tsc --noEmit`, and `npx eslint src/server app/api tests/server db/schema.ts`. Current result: 22 isolated Node checks pass; TypeScript and scoped ESLint pass. Node tests derive private in-memory SQLite tables from Drizzle and use real guard SQL plus mocked R2/fetch. They do not execute a project migration or prove D1/R2 deployment behavior.
4. Verify this specialist's emitted final against its automatically captured log before committing. Exact 5,923-character handoff was found once in `.agent-logs/2026-10-12_01-46-30_01a12dca-3506-7542-9966-1c5e74d448ac.md`; session `01a12dca-3506-7542-9966-1c5e74d448ac`, actual model `gpt-6-astra`. Raw logs were not edited.

## Deliberate operational limits

See `src/server/README.md`. Image validation and MP4 checks are structural, not full codec/model decoders. Video transfer requires Content-Length. Unknown billing stays counted; no automatic orphan purge or spend release exists after submission. No provider request, package installation, browser action, infrastructure operation, migration execution, commit, push, or deployment was performed by this specialist. R1 and live V3 remain unverified. Root owns retention/abuse controls and any later explicitly authorized provider validation.
