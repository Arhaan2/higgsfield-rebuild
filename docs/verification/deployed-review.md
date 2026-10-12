# Independent hosted acceptance review

Task **direct-public-review-001**, Reviewer, 2026-10-12 UTC. **Pass within the assigned HTTP/source scope: 20 checks pass; no confirmed important product defect.** This does not complete the assignment. Root owns browser acceptance and Cloudflare deployment metadata; real-provider acceptance, recording and future-final capture remain pending.

Target: https://higgsfield-rebuild.arhaan2.workers.dev. Requested source **f271258fd0d4fece10229dfd74c89dfd5bcf275f**, previously reviewed product **b32b03e7f867fa78b4c075890b76a9d41d736287**. Read AGENTS.md, TEAM.md, REVIEWER.md, prior submission review/evidence, HTTP verification script and relevant source. Applied the installed Apple Design skill to explicit action/acknowledgement, preserved work and truthful status/provenance; used Workers review guidance for policy, ownership and media boundaries.

## Independently observed results

HTTP checks ran **18:54:49–18:57:59 UTC**. The [machine-readable record](deployed-review-checks.json) contains request UTC times, statuses, byte counts, SHA-256 values, selected non-secret headers, source fingerprints and assertion corrections. Its main request record contains 63 requests; the initial three-request probe is retained separately. A few preliminary read-only inspection requests are described in this report but are not included in that request count.

| Acceptance | Actual observation |
| --- | --- |
| Anonymous entry/deep links | `/`, `/studio?sample=dune-study`, `/library` return **200**, with integrated Frame/Studio/Library markers. Studio HTML contains `Opening your studio…` and `Live generation off`; sample selection happens after hydration. This establishes delivery, not successful hydration. |
| Zero-generation policy | `/api/capabilities` reports **enabled false**, reason **disabled**, budget **0**, remaining **0**. Independently rechecked before every mutation and at completion. No reviewer job endpoint or provider request. |
| Saved draft/upload/preference | Guest A created one draft, uploaded the licensed JPEG, saved its movement/start-frame references and explicitly PATCHed preference. A fresh detail read returns exact saved draft, uploaded asset, **preferredAssetId**, revision **3**, and **zero jobs**. Library list returns the identical project. These are fresh HTTP reads, not browser reload proof. |
| Prepared-reference draft | Separate guest B created a draft referencing `sample-dune-light`; fresh GET preserves the exact draft with zero jobs. Its list contains only its own project. |
| Ownership | Guest B receives **404 NOT_FOUND** for A’s project, asset metadata, media and download. Foreign project preference and foreign asset preference writes return **404**. Anonymous private project/media/download return **401**. |
| Origin/revision protection | Foreign Origin, cross-site fetch and missing Origin session writes return **403 ORIGIN_FORBIDDEN**, without Set-Cookie. Cross-origin owned-project PATCH returns **403**. Stale revision returns **409 REVISION_CONFLICT**; fresh read retains title, draft and preference. |
| Exact private download | **200**, image/jpeg, attachment disposition; **187,464 bytes**, exactly equal to repository JPEG. `Cache-Control: private, no-store`; `Vary` contains Cookie plus Vinext routing tokens. |
| Public prepared video | Anonymous **200 video/mp4**, **11,342,355 bytes**, exact repository checksum and MP4 signature. Catalog source is sample, with null project/source job; prepared presets are explicitly flagged. This does not prove browser decoding/playback. |
| Generation accounting | Upload response says **upload**, with null source job. Sample catalog assets say **sample**. Observed test-project reads have zero jobs; Library source counts only `source === "generation"`. Prepared sample presentation is separate from saved shots. |

Only **two disposable guest sessions, two projects and one upload** were created. Cookies existed only in process memory and were never printed or stored. Cookies were discarded when the process exited; test data remains disposable server data, and no deletion/migration was attempted. Project and asset IDs are recorded in JSON. Each guest cookie had HttpOnly, Secure, SameSite=Lax, `__Host-` prefix and root path.

Checksums:

- JPEG: `4d5d695a1fc7745268274c89663550be54a7416942e56f13f6675a625584442a`.
- Prepared MP4: `356a6ef6192ae00b955b82755c7c07cb6ff767da79995e574925e7c2a64e633e`.

## Source and deployment attribution

Anonymous [GitHub main](https://api.github.com/repos/Arhaan2/higgsfield-rebuild/commits/main) returned **f271258fd0d4fece10229dfd74c89dfd5bcf275f** at **18:57:57.677 UTC**. The public GitHub recursive tree was not truncated; independently calculated Git blob hashes match **130 local product/source/test/configuration files** to that immutable candidate. The public b32b03e→f271258 comparison contains 20 documentation/capture/evidence changes and **no product/test/configuration changes in the inspected set**. Final SHA-256 recheck confirms all 130 remained unchanged.

The served Studio HTML contains Vinext build ID **4fe8a9b2-8d73-4d0d-bbcf-7227fe62d34f**, equal to current `dist/server/BUILD_ID`. All **nine referenced JS/CSS assets**, including StudioView, match the local fresh build byte-for-byte. This connects delivered assets to the available build, without claiming an independent reproducible build or a provider deployment signature.

Cloudflare version **cbe42062-203d-462c-949e-0d4bd380beac**, tag **f271258**, comes from root’s assignment. Root owns confirmation of that live version and bindings. It is distinct from the independently observed Vinext build ID and public source SHA; neither GitHub main nor HTML alone proves Cloudflare version metadata.

The current prepared `.cache/cloudflare/wrangler.json` independently contains the hosted APP_ORIGIN, **LIVE_GENERATION_ENABLED=false**, **GENERATION_BUDGET_USD=0**, DB and BUCKET bindings, private bucket name `higgsfield-rebuild`, nodejs_compat and enabled observability. Its SHA-256 is recorded in JSON. Successful hosted writes establish runtime origin/storage integration in this scope; the local config is not an account-level live-binding query. User/root R2 activation and D1 seven tables/ten guards/FK clean/zero policy rows remain attributed inputs. No migration replay, billing change or authenticated infrastructure operation occurred.

## Guard and interface review

`src/server/http.ts` requires exact configured Origin and rejects cross-site mutations; `api.ts` applies it before session creation/routing. `store.ts` scopes project, asset and job lookup to guest ownership. Project PATCH validates owned private preferred assets against the current project and performs revision-guarded updates. Catalog references and same-owner cross-project references are explicit source exceptions, not cross-guest access.

`jobs.ts` takes the smaller environment/database cap, treating missing policy as zero; admission denies disabled/zero generation before insertion/submission. Provider progress also stops when disabled/zero. `media.ts` reaches R2 after ownership and streams retained media with private caching and download disposition. Current [Workers guidance](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) and published type definitions were retrieved read-only; no package was installed.

Apple Design’s agency and specific feedback principles are reflected in source: inspection is local, durable preference requires an explicit acknowledged action, saving/retry/confirmed states have distinct labels, and error/conflict paths preserve drafts. Studio labels samples and uploads separately; Library’s generation count excludes both. No new rendered layout, animation, reduced-motion, keyboard or accessibility acceptance is inferred from this source inspection.

## Verification boundaries and corrections

Reuse the prior independent **138 controlled checks** on unchanged b32b03e product: 58 Studio, 29 reference action, 15 Library and 36 server checks. They remain mock/controlled evidence, not real-provider proof. Root’s fresh build is reused; reviewer ran no build, TypeScript or unchanged suites. The existing successful build transcript was read, and current fresh-build assets were independently matched as described above.

Root’s separate [hosted integration run](deployed-http-integration.json), **18:52:33.680 UTC**, records **11 passing checks**, including Range/HEAD, upload retry, invalid upload and disabled-job denial. Those checks remain root-attributed; they are not added to this reviewer’s 20.

Two reviewer assertions were too strict and were corrected with preserved evidence. First, Studio’s client-rendered sample label was incorrectly expected in initial HTML. Second, exact `Vary: Cookie` equality incorrectly rejected additional Vinext routing tokens. Exact private-download length/hash had already passed before that assertion stopped the session process; persisted safe response metadata confirms the remaining header checks, including Cookie membership and image/jpeg. This was a harness correction, not a product repair. Private Range/HEAD were not independently run afterward because the two guest sessions had been used and their cookies intentionally were not retained. The initial failed assertions remain in JSON; neither is a confirmed product defect.

Root’s browser upload/save/reload/Library/preference/playback/download work is separate and was not observed or claimed here. Real provider image/video acceptance remains unrun with generation disabled and zero allowance. Actual camera-on walkthrough access, duration and visibility remain pending. R1 remains an explicit exception; this review grants no waiver. Two unrelated automatic suggestion sessions with native journals but no discoverable full transcripts remain separate unresolved provenance; they were not conflated with this session or altered.

## Capture and closure

Actual session **01a13175-6f40-7371-a8f8-5e8e83863da9**, recorded model **gpt-6-astra**. Before substantive work, the entire **3,869-character assignment** was present in the automatically created `.agent-logs/2026-10-12_18-52-23_01a13175-6f40-7371-a8f8-5e8e83863da9.md` and matched handoff27 after trimming surrounding whitespace. Prompt SHA-256: `e6ecf89a77709c0b160982ece9e6fb2f9b7770cbc9be275652382fb6c61d1fd0`. Raw logs remained read-only.

Only `docs/verification/deployed-review.md` and `docs/verification/deployed-review-checks.json` were authored. No worker, browser automation, install, Git CLI/repository mutation, product/config/test edit, migration, billing or provider action. Initial sandbox DNS failure was resolved by an authorized outside-sandbox ordinary HTTP retry.

This reviewer’s full final and root’s future final cannot be verified before emission. Root must compare the complete final after Stop, verify capture, reconcile its browser/deployment evidence and checkpoint, then commit/push. Coordinator-only closure commands, **not executed by reviewer**:

```sh
tail -n 180 .agent-logs/2026-10-12_18-52-23_01a13175-6f40-7371-a8f8-5e8e83863da9.md
PYTHONDONTWRITEBYTECODE=1 python3 scripts/capture/verify.py
git diff --check
git status --short
git add docs/verification/deployed-review.md docs/verification/deployed-review-checks.json .agent-logs/2026-10-12_18-52-23_01a13175-6f40-7371-a8f8-5e8e83863da9.md
git commit -m "Record independent hosted HTTP acceptance and verified reviewer capture"
git push origin main
```

Run capture comparison before staging; include separately verified coordinator metadata/checkpoint changes under root ownership. Repeat final-capture closure after root stops. No response not yet emitted is claimed captured or committed.
