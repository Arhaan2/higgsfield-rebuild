# Acceptance checklist — current evidence

Application checks below are pending unless explicitly marked. Record actual method, environment, source/deployment revision, date and result. A plan, screenshot of a form, or teammate assertion is not proof that a backend operation completed.

## Capture and research

- [ ] Official first-message process followed in the actual coding environment.
- [x] Two real independent-session canaries captured automatically. See CAPTURE-TEST.md.
- [x] Root CAPTURE-TEST.md created from genuine evidence; raw logs tracked incrementally.
- [x] Independent CLI delegation verified before production; native children/worktrees unused.
- [ ] Required signed-in research completed; unresolved flows explicitly addressed.
- [x] Actual Apple Design skill discovered, read and used in accepted D2 design decisions.

## Core deployed product

- [x] Fresh unauthenticated evaluator can open and use the intended entry path.
- [x] Sample project is immediately inspectable and clearly labeled.
- [x] Supported image upload validates, previews and persists in hosted D1/R2.
- [ ] Uploaded image reaches a real provider generation request.
- [ ] Exposed controls map to supported server-validated inputs.
- [ ] Real uploaded-image-to-video job completes on the deployed environment.
- [ ] Real image generation and its video handoff work for the final target scope.
- [ ] Pending, success, failure and uncertain-submission states are truthful.
- [ ] Failed jobs retain the draft and provide a useful recovery action.
- [ ] Duplicate clicks/retried submissions do not create unintended extra paid jobs.
- [x] Hosted reload/deep links restore saved drafts, references and preferred versions; Library reopens them.
- [ ] Real generated-job/history reload acceptance.
- [x] Prepared sample video plays to completion; uploaded images display; ordinary hosted downloads match source bytes.
- [ ] Real generated results display/play/download correctly.
- [ ] Reuse/variation preserves original work and restores relevant settings.
- [x] Hosted guest isolation rejects unrelated project, asset, media and download access.
- [ ] Actual generated-job ownership acceptance (controlled guards pass; real jobs unrun).
- [x] Hosted generation policy is disabled with zero allowance; denied request creates no job.
- [ ] Live provider accounting/usage behavior (only controlled tests run).

## Design and interaction

- [x] Specified desktop/mobile views have usable critical controls: hosted1440/390px, prior local320px/200% repairs. Physical phone remains unrun.
- [ ] Keyboard focus, labels and the primary action are clear.
- [ ] Essential actions do not rely solely on hover.
- [ ] Loading/failure/sample/success states fit the same design system.
- [ ] Typography, spacing, surfaces, accents and media framing are consistent.
- [ ] Reduced-motion and touch behavior are addressed where applicable.
- [ ] Every exposed action is implemented or honestly explains its limitation.

## Delivery

- [x] Public repository opens while signed out (GitHub public metadata HTTP200,2026-10-12 02:46 UTC; public-access.json).
- [x] Public live URL opens while signed out and matches the reviewed revision.
- [x] README has reproducible setup, real links, actual capabilities and limitations.
- [ ] Repository/history/log review finds no exposed credentials or private account media.
- [x] Raw logs remain automatic and incremental, without rewritten entries. Four suggestion sessions have journal-only proof; full-source coverage is not claimed for them.
- [ ] Final-response capture closure is complete after the agent stops.
- [ ] Actual walkthrough has Arhaan's camera on and duration below five minutes.
- [ ] Walkthrough link is accessible to a reviewer.
- [x] Live and repository links are separately labeled.
- [ ] Actual video URL placed in walkthrough field.

## Evidence record

Keep a compact table: check ID; test method; expected observable behavior; actual result; source commit; deployment revision; artifact/source; remaining issue. Store selected review evidence under docs/verification/ rather than relying on ignored transient browser reports. Stop broad testing once the required gates pass; retest changed behavior when fixing a concrete defect.

D2 accepted 2026-10-12 01:35 UTC. R1 remains incomplete under the explicit research exception. Local implementation, rendered review/repairs and bounded mocked/HTTP/browser checks now exist; see STATUS and docs/verification. The earlier Sites integrated attempts failed; the current direct Worker is now deployed and its zero-spend paths pass. Full provider acceptance remains pending. The walkthrough is unrecorded. Unqualified creation/result checks above are deliberately not checked on the strength of samples or local mocks.

## Phase 4–6 local checkpoint (does not check off deployed criteria)

| Area | Actual result | Evidence / limit |
| --- | --- | --- |
| Draft handoff, Library/reload, same-reference editing | pass locally | Real browser, preserved saved/unsaved prompt and reference; phase456-browser.md. |
| Failure quota, cross-project lineage/ownership | pass in controlled tests |36 server tests; no real provider call. |
| Recovery, metadata, Library retry, draft actions | pass in controlled tests |44Studio,6Library,18action checks; includes delayed-save typing. |
| Core layout and state rendering | pass for specified rendered contexts | 1440/390px state matrix, 320px details and 44px attribution. Initial 200% reference wrapping failed; the repaired 390px fixture is readable and ordinary 320/390/1440px widths were rechecked. Native preferences/physical phone unrun. |
| Production build and TypeScript | pass | Root ran both after integration. |
| Public deep route/current source alignment | fail | Public Studio404; only the older sample shell is live. |
| Real image/video loop and recording | not_run |$0generation allowance, no fullpublicdeployment, actual walkthrough absent. |

Independent phase-5/phase-6 reports now record 104 passing controlled checks and a fail/blocked release verdict. The enlarged-text layout and public-source alignment follow-up is in verification/phase56-followup.md. Historical review failures remain in their original reports, with repairs tracked separately. The public Studio is now resolved by the direct deployment below. Actual provider outputs, native accessibility contexts and recording remain unresolved.

## Submission reconciliation

- The user-supplied external audit reproduced all 104 prior checks on 5bd4a39. It did not pass integrated deployment, generation, recording or final capture closure.
- The preceding coordinator final response has since been verified from genuine source and committed in 2394c92. This active turn's future final remains pending; the final-response checkbox stays unchecked.
- Original guide bytes and two real canaries are preserved. The first source message supplied a file attachment reference rather than the full inline guide, so the formal first-message item remains unresolved; successful later capture does not retroactively change the original message.
- Required signed-in real output chains remain unverified under the explicit research exception and zero-spend constraint. No new provider check occurred.
- Current source repairs and actual local browser observations are in verification/INDEX.md. The independent continuation review records their bounded acceptance. Those historical Studio/Library404 results are superseded by the direct deployment below. Only newly observed hosted criteria above are checked; mocks do not prove provider acceptance.
- Existing credential/history review found no known matching text secrets within its documented limits. It was a bounded scan, not proof that every binary or media asset is free of private material; retain that limitation.

## Direct deployed checkpoint — 2026-10-12

Source f271258fd0d4fece10229dfd74c89dfd5bcf275f / Worker cbe42062-203d-462c-949e-0d4bd380beac is live at https://higgsfield-rebuild.arhaan2.workers.dev. [Deployment metadata](verification/deployed-cloudflare.json), [11 root HTTP checks](verification/deployed-http-integration.json), [20 independent HTTP/source checks](verification/deployed-review.md), and [actual browser evidence](verification/deployed-browser.md) support the narrowly checked criteria above. APP_ORIGIN matches; generation false/cap0; no provider secret; migration not replayed. No account-wide hard$0cap is inferred from R2 free allowances.

Hosted browser acceptance includes explicit preferred-version persistence, preset-only thumbnail/reopening and complete prepared playback/download. Old generated-job selection→upload remains controlled-test evidence because no real provider job exists. Opening/closing asset details with Escape returns focus to its trigger; this is a bounded keyboard observation, not a full accessibility pass. The complete zero-spend demonstration is prepared and the actual camera-on recording has been requested. Recording/access/duration and future-final capture boxes remain unchecked.

## Final sprint — source `0899d59`

- [x] Exact current saved/unsaved shot briefs download as Markdown, preserve Unicode/multiline/fences and distinguish requested settings from reference provenance. Actual files inspected locally.
- [x] Export triggers no save/job request and preserves a pending save, selection/preference and newer edits in 26 controlled checks. Genuine pending-save browser timing not claimed.
- [x] Library searches title/prompt, composes task filter/sort/reset, uses current details, preserves pagination and failure/expiry boundaries. 31 controlled Library checks pass.
- [x] Three real saved local shots found by title/prompt; editing moved recent order; sample collection remained separate.
- [x] New 390px Studio/Library and desktop Studio checked, no horizontal overflow; search/reset/header-jump keyboard focus checked.
- [x] Fresh TypeScript/build and 180 controlled checks; 11 hosted HTTP checks on the new Worker.
- [x] Independent public export/Library cases: six real downloaded briefs, three saved shots, search/filter/sort/reset/update ordering, prepared-reference reload, keyboard and 390px/desktop layouts. [Review](verification/final-sprint-public-review.md).
- [x] Coordinator public uploaded reference: save/preference/reload/Library reopen, exact unsaved brief and byte-identical ordinary image download. [Completion](verification/final-sprint-public-upload.md).
- [ ] New public reference-versus-independent-clip inspection case: automatic approval review rejected selection; controlled checks and earlier playback remain separately attributed.
- [ ] Actual camera-on recording and reviewer access/duration verification.

Sources: verification/final-sprint-local.md, final-sprint-local-downloads.json, final-sprint-http.json and final-sprint-cloudflare.json. These checks do not change historical provider/research/process acceptance.

## Additional creative sprint — deployed source `c89cde2`

Worker `ffdcad33-1b55-44c7-bf6f-a09fa1162a68`,2026-10-12 20:52UTC. [Local](verification/creative-local.md), [independent repair review](verification/creative-integration-review.md), [public workflow](verification/creative-public.md), [11 hosted checks](verification/creative-http.json).

- [x] Saved image and motion duplication; new identity, frozen retry and zero output history (local browser plus isolated API).
- [x] Actual public original remains unchanged after editing/saving/reloading its copy; source-owned uploaded reference survives.
- [x] Copy acknowledgement stays in Library, Open copy is explicit; physical double-click repair retested locally.
- [x] Editable direction selection leaves draft unchanged; explicit replacement and valid exact Undo work; later typing disables stale Undo.
- [x] Public local camera study completes; Play/Stop/Replay work with actual draft reference. No AI-result claim or mutation path.
- [x] Public exact saved brief downloaded and inspected; existing query controls and390px keyboard layout pass.
- [x] Fresh TypeScript/build and264 controlled checks;11 actual hosted checks run once on this release.
- [x] Reduced-motion/reference/context/close/pagehide/unmount cases pass controlled tests; CSS still fallback reviewed.
- [ ] Native OS preference changes, physical touch device and screen reader verified.
- [ ] Actual AI generation and camera-on recording acceptance.

Failure/expiry/quota/lost-ack tests remain controlled evidence, not browser injections. Multi-tab attempt storage is not claimed atomic. All completed specialist full prompts/finals match actual source; current root final remains future capture. Historical broad generation/research checkboxes above stay open.
