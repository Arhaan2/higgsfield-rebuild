# Acceptance checklist — not yet executed

All checks below are pending. Record actual method, environment, source/deployment revision, date and result. A plan, screenshot of a form, or teammate assertion is not proof that a backend operation completed.

## Capture and research

- [ ] Official first-message process followed in the actual coding environment.
- [ ] Two real independent-session canaries captured automatically.
- [ ] Root CAPTURE-TEST.md created from genuine evidence; raw logs tracked incrementally.
- [ ] Delegation and any worktree capture destinations verified before production use.
- [ ] Required signed-in research completed; unresolved flows explicitly addressed.
- [ ] Actual Apple Design skill discovered, read and used in design decisions.

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

- [ ] Public repository opens while signed out.
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
