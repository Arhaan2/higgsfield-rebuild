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

- [ ] Fresh unauthenticated evaluator can open and use the intended entry path.
- [ ] Sample project is immediately inspectable and clearly labeled.
- [ ] Supported image upload validates, previews, persists and reaches the real request.
- [ ] Exposed controls map to supported server-validated inputs.
- [ ] Real uploaded-image-to-video job completes on the deployed environment.
- [ ] Real image generation and its video handoff work for the final target scope.
- [ ] Pending, success, failure and uncertain-submission states are truthful.
- [ ] Failed jobs retain the draft and provide a useful recovery action.
- [ ] Duplicate clicks/retried submissions do not create unintended extra paid jobs.
- [ ] Reload/deep-link behavior restores the promised draft/job/history boundary.
- [ ] Results display/play correctly and download retrieves the correct file.
- [ ] Reuse/variation preserves original work and restores relevant settings.
- [ ] Visitor ownership prevents access to unrelated private assets/jobs.
- [ ] Server-side usage limits and the approved spending cap are enforced.

## Design and interaction

- [ ] Laptop and narrow mobile views have no clipped/obscured critical controls.
- [ ] Keyboard focus, labels and the primary action are clear.
- [ ] Essential actions do not rely solely on hover.
- [ ] Loading/failure/sample/success states fit the same design system.
- [ ] Typography, spacing, surfaces, accents and media framing are consistent.
- [ ] Reduced-motion and touch behavior are addressed where applicable.
- [ ] Every exposed action is implemented or honestly explains its limitation.

## Delivery

- [x] Public repository opens while signed out (GitHub public metadata HTTP200,2026-10-12 02:46 UTC; public-access.json).
- [ ] Public live URL opens while signed out and matches the reviewed revision.
- [ ] README has reproducible setup, real links, actual capabilities and limitations.
- [ ] Repository/history/log review finds no exposed credentials or private account media.
- [ ] Logs are incremental, with no invented entries or rewritten narrative.
- [ ] Final-response capture closure is complete after the agent stops.
- [ ] Actual walkthrough has Arhaan's camera on and duration below five minutes.
- [ ] Walkthrough link is accessible to a reviewer.
- [ ] Live and repository links are labeled; video goes in the walkthrough field.

## Evidence record

Keep a compact table: check ID; test method; expected observable behavior; actual result; source commit; deployment revision; artifact/source; remaining issue. Store selected review evidence under docs/verification/ rather than relying on ignored transient browser reports. Stop broad testing once the required gates pass; retest changed behavior when fixing a concrete defect.

D2 accepted 2026-10-12 01:35 UTC. R1 remains incomplete under the explicit research exception. Local implementation, rendered review/repairs and bounded mocked/HTTP/browser checks now exist; see STATUS and docs/verification. Full deployed-product acceptance remains pending because integrated publication failed twice; current public access reaches only version1's sample shell. The walkthrough is unrecorded. Unqualified creation/result checks above are deliberately not checked on the strength of samples or local mocks.

## Phase 4–6 local checkpoint (does not check off deployed criteria)

| Area | Actual result | Evidence / limit |
| --- | --- | --- |
| Draft handoff, Library/reload, same-reference editing | pass locally | Real browser, preserved saved/unsaved prompt and reference; phase456-browser.md. |
| Failure quota, cross-project lineage/ownership | pass in controlled tests |36server tests; no real provider call. |
| Recovery, metadata, Library retry, draft actions | pass in controlled tests |44Studio,6Library,18action checks; includes delayed-save typing. |
| Core layout and state rendering | pass for specified rendered contexts | 1440/390px state matrix, 320px details and 44px attribution. Initial 200% reference wrapping failed; the repaired 390px fixture is readable and ordinary 320/390/1440px widths were rechecked. Native preferences/physical phone unrun. |
| Production build and TypeScript | pass | Root ran both after integration. |
| Public deep route/current source alignment | fail | Public Studio404; only the older sample shell is live. |
| Real image/video loop and recording | not_run |$0generation allowance, no fullpublicdeployment, actual walkthrough absent. |

Independent phase-5/phase-6 reports now record 104 passing controlled checks and a fail/blocked release verdict. The enlarged-text layout and public-source alignment follow-up is in verification/phase56-followup.md. Historical review failures remain in their original reports, with repairs tracked separately. The complete public Studio, actual provider outputs, native accessibility contexts and actual recording remain unresolved.
