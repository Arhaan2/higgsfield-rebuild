# Independent submission repair review

Task `submission-repair-review-001`, Reviewer, 2026-10-12 UTC. Immutable candidate **`b32b03e7f867fa78b4c075890b76a9d41d736287`**, reviewed against `2394c92026108296b5e64171db6bd19400fa6016`. **All three requested repairs pass within the local/controlled boundaries below. Full release remains blocked.** Fresh public main matches the candidate; the public application does not.

Read AGENTS.md, TEAM.md, REVIEWER.md, the installed `/Users/arhaan/.codex/skills/apple-design/SKILL.md`, all assigned reports and current source. Applied the skill's agency, predictable selection, explicit status/error feedback and readable hierarchy guidance. No implementation, configuration, test, historical-report or capture edits were made. No browser automation, other agent, install, Git mutation, publishing, migration, provider or billing operation occurred.

## Repair verdicts

| Repair | Result | Independently inspected evidence and boundary |
| --- | --- | --- |
| SR-01: explicit durable preferred version | **pass** | `preferAsset` sends only `expectedRevision` and `preferredAssetId` through the existing PATCH API. Inspection does not write. It waits for an existing save; a subsequent save waits for preference and takes the latest buffer/revision. Acknowledgement checks project ID, requested asset and revision increment before confirmation. Draft buffers, including inactive invalid text and typing during requests, remain intact. 58 Studio and 29 action checks pass, including dirty/clean reload, retry, conflict, expiry, copy/session stale responses and navigation waiting. Root's actual localhost upload preference/reload is supplementary evidence; no hosted/generated-version persistence is claimed. |
| SR-02: old selected job → successful new upload | **pass** | `StudioView` now uses the selected retained asset as stage authority; local job selection represents a request without selected output. Job-card output requires succeeded status and membership in the job's output IDs. The actual component/hook mock checks prove an old selected job yields to the uploaded reference. The succeeded/queued/failed/transfer-failed matrix preserves selection during pending/failed upload and shows no invented output for unsuccessful requests. Originals remain unchanged. No real provider job exists for a browser reproduction of this case. |
| SR-03: preset-only Library preview | **pass** | Library reads preference and draft from current detail, then chooses preferred retained asset, last retained asset, or an assetless motion draft's start frame. Public catalog lookup precedes exact-ID owner-scoped asset retrieval. ID/kind mismatches and missing references become recoverable preview failures. The 15 checks cover current-detail precedence, mixed success/targeted retry, expiry, stale epochs/unmount and external references without generation-count/job contamination. The independently viewed Library capture visibly shows the preset thumbnail and **0 generated versions**. |

Preference UI has specific saving, confirmed and retry labels, disabled conflict/expiry actions, and status/alert semantics; notices name the attempted asset even if inspection changes. The preference action rejects samples and assets outside the current project. The existing server guard independently resolves the owned project and non-public asset, rejects an asset from another project, and updates only matching project/guest/revision; zero updated rows returns `REVISION_CONFLICT`. Public catalog references remain an existing server exception, while the new client action requires a retained private asset. Existing ownership/revision checks pass; no server source changed from the external-audit baseline.

No new important product defect was found in this bounded review. This is not a claim that untested environments or the complete application are defect-free.

## Checks and immutable evidence

| Independently executed command | Result | Baseline / added |
| --- | --- | --- |
| `node src/client/checks/studio-state.mjs` | 58 pass, exit 0 | 44 / 14 |
| `node src/client/checks/reference-action.mjs` | 29 pass, exit 0 | 18 / 11 |
| `node src/client/checks/library-state.mjs` | 15 pass, exit 0 | 6 / 9 |
| `node --import ./tests/server/register.mjs --test tests/server/*.test.mjs` | 36 pass, exit 0 | 36 / 0 |

**138 controlled checks = 104 baseline + 34 added client regressions.** Client checks execute real hook/component source with mocked React/API scheduling; server checks use isolated in-memory SQLite and mocked storage/provider behavior. They do not prove a live provider operation or deployed D1/R2 integration. The user-supplied external audit's 104 passes belong to `5bd4a39e28f0fa1d582a3070b1cdd348e43401f8`; this review independently reran the current suites on b32b03e, not on that historical commit.

The [machine-readable record](submission-review-checks.json) preserves command outputs, exact revisions, HTTP timestamps/hashes and 26 candidate artifact fingerprints. All 26 inspected working files equaled the immutable candidate at the recorded initial fingerprint time. Product source/tests/configuration remained unchanged at the 04:48:40 UTC scope check; concurrent tracked differences were coordinator documentation only. Root's successful TypeScript and production build are reused: candidate `docs/agents/ASSIGNMENTS.md` records the 04:43 UTC integration pass, and [build output](submission-build.txt) contains all five completed stages. Reviewer build/TypeScript rerun: **not_run**, deliberately avoiding an unnecessary rebuild.

Concurrent coordinator documents observed separately: `README.md`, `docs/ACCEPTANCE.md`, `docs/DECISIONS.md`, `docs/STATUS.md`, `docs/SUBMISSION.md`, `docs/TECH-SPEC.md`, `docs/WALKTHROUGH-SCRIPT.md`, `docs/agents/ASSIGNMENTS.md`, `docs/verification/INDEX.md`, and `docs/verification/submission-local-browser.md`. The last two changed after initial fingerprinting: the browser report adds root's later 320/1440px preference-control measurements; the index links this review and those measurements. Their original committed content remains the candidate evidence reviewed here. New `submission-preference-final-desktop.png`, `submission-preference-final-mobile.png` and `submission-preference-layout.json` are separate root evidence, not independently viewed/accepted by this review. The initial equality statement is timestamped, not a final clean-tree claim. The active automatic log and handoff26 are also new coordinator/capture artifacts. Root owns their integration and checkpoint.

## Actual screenshot review

Both assigned images were independently opened and viewed, then inspected with `sips`: **320 × 1000**, JPEG encoding despite their preserved `.png` filenames. No image was modified.

- [Preferred/reloaded Studio capture](submission-preferred-reloaded.png) visibly shows the saved-draft-restored notice, Phase 3 recovery check, start-frame thumbnail and disabled live generation. The preferred-version button and movement prompt are **outside the captured viewport**. This image alone cannot prove preference confirmation or persistence. [Root's browser narrative](submission-local-browser.md) attributes the actual click, acknowledgement, reload and retained prompt to root; controlled checks independently support the state behavior.
- [Preset Library capture](submission-preset-library.png) visibly shows “A slow reveal”, the dune thumbnail and “Motion draft · 0 generated versions”, with readable card text and narrow-screen navigation. Root owns the observed decoded `/samples/dune-light.jpg` source and subsequent reopening of the saved prompt/start frame. The image does not itself prove reopening, media ownership or a generated output.

These are localhost application captures using local state, not hosted acceptance or this reviewer's browser execution. Static crops do not establish complete keyboard, motion, scrolling, touch or accessibility acceptance.

## Public source and delivery boundary

Fresh anonymous, read-only GETs at **2026-10-12 04:44:59 UTC**, without credentials/cookies/Authorization, observed:

| Endpoint | Actual result |
| --- | --- |
| [Homepage](https://higgsfield-rebuild.rich-bun-3830.chatgpt.site/) | HTTP 200; prepared-sample shell marker present |
| [Studio sample route](https://higgsfield-rebuild.rich-bun-3830.chatgpt.site/studio?sample=dune-study) | HTTP 404 |
| [Library](https://higgsfield-rebuild.rich-bun-3830.chatgpt.site/library) | HTTP 404 |
| [GitHub public main](https://api.github.com/repos/Arhaan2/higgsfield-rebuild/commits/main) | HTTP 200; **b32b03e7f867fa78b4c075890b76a9d41d736287** |

The initial restricted-sandbox requests failed DNS before receiving HTTP; the authorized network retry succeeded. Exact responses/timestamps/body hashes are in the JSON evidence. Repository-source alignment **passes**; integrated public entry/deep-route delivery **fails**.

Exact deployment identity is attributed to root's committed [Sites preflight](submission-sites-preflight.json), not inferred from the homepage body: live **version 1**, source **`6d5a576832f7704feade88d7f483ab402b924d0c`**, deployment `appgdep_6acc3b777bf88191aed554b79b0d67e3`. Version 2/source `88b273a4cadfb57d080df1d6f1fd915ed7b756ba` and version 3/source `e9d66bb7d8f5c83e656afdbffc423779c4d9a9b7` failed. No integrated deployment is claimed.

Root's [resource preflight](submission-resource-preflight.json) remains attributed: same account, R2 error **10042**, Worker absent **10007**, existing D1 **7 tables/10 guards**, no foreign-key violations, **zero policy rows**, migration not replayed. No reviewer authenticated resource request was made. The pending user-owned R2 activation question is not approval to activate billing, accept overages or spend. Generation remains disabled and cap 0.

Hosted upload/save/reload/preference/Library/ownership/playback/download checks remain **not_run** pending actual integrated publication. Real provider image/video acceptance, the actual camera-on recording, native accessibility/OS preferences/screen-reader and physical-phone checks are **not_run**. R1 remains the explicit exception; no research, generation or recording waiver is granted. Prior capture/security results remain attributed and bounded; this task did not reaudit unchanged history. The formal original-first-message issue is not retroactively resolved by working later capture.

## Capture and handoff

Actual session `01a12e6c-a616-7122-b93b-24226a36007f`, recorded model `gpt-6-astra`; automatic log `.agent-logs/2026-10-12_04-43-56_01a12e6c-a616-7122-b93b-24226a36007f.md`. Before substantive work, the complete 3,901-character assignment matched the automatic log and handoff26 after trimming surrounding whitespace. Raw capture was read-only. The supplied 35-session source audit belongs to root's prior verification, not a new reviewer audit.

This review is complete within its assignment. **Its full final and the active coordinator's final cannot be verified before emission.** Root must compare the entire automatic final after Stop, verify capture, integrate the checkpoint and commit/push the remaining genuine evidence. Neither future response is claimed captured or committed here. Coordinator-only closure commands, not executed by this reviewer:

```sh
tail -n 180 .agent-logs/2026-10-12_04-43-56_01a12e6c-a616-7122-b93b-24226a36007f.md
PYTHONDONTWRITEBYTECODE=1 python3 scripts/capture/verify.py
git diff --check
git status --short
git add docs/verification/submission-review.md docs/verification/submission-review-checks.json .agent-logs/2026-10-12_04-43-56_01a12e6c-a616-7122-b93b-24226a36007f.md
git commit -m "Record independent submission repair review and verified capture"
git push origin main
```

Compare the full final before staging; include any separately verified provenance/checkpoint updates under root's ownership. Repeat the actual-root final capture closure after root stops. Next delivery dependency remains user-owned R2 availability within the existing spending constraint, then coordinator publication and hosted verification; do not replay the initial migration.
