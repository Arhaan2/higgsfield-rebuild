# Phase 5 — Refine the running product with Apple Design

Act as the lead coordinator. The product already has a working creation loop. Improve clarity, visual coherence and interaction quality without restarting the architecture or introducing unrelated features. The user explicitly requested the installed Apple Design skill; apply the actual skill to the running application and document concrete choices.

Read AGENTS.md, docs/RECON.md, docs/DESIGN-BRIEF.md, docs/ACCEPTANCE.md, docs/STATUS.md, and docs/agents/TEAM.md. Confirm the current running/deployed revision and the real skill locator. Read its required references where relevant. Do not claim project preferences came from the skill unless they actually did.

## Delegate focused work

- Designer: read docs/agents/DESIGNER.md and the actual Apple Design skill. Own docs/design/implementation-review.md and explicitly assigned style/token paths. Review desktop/mobile screens and interaction states, prioritize observed defects, and implement only owned changes.
- Frontend: own specifically assigned component/page repairs from the designer's findings. Preserve working contracts, draft state and generation behavior. Do not change backend or shared dependencies.
- Reviewer: own docs/verification/phase-5.md. Independently check keyboard/touch access, responsive layout and honest states. Record reproducible problems and verify agreed fixes.

Allocate exclusive paths before any edits. If a designer needs to modify a frontend-owned component, transfer that path explicitly and stop overlapping writes. Root owns integration, root layout/configuration, capture/git and deployment.

## Inspect the actual experience

Review Explore, Studio, Library and asset details at representative laptop and narrow phone widths. The primary action, input requirements, output and next step should be immediately understandable. Check typography, spacing, surface hierarchy, preview quality, alignment, clipping, focus, labels and contrast. Keep the media prominent without hiding essential controls. Make touch actions available without hover.

Exercise first visit/sample, empty draft, uploaded reference, validation error, submitting, pending, uncertain outcome, success, recoverable failure, usage limit and restored iteration. Capture evidence using real or explicitly isolated test states. Do not spend provider credits merely to obtain repeated visual screenshots. State simulation clearly in verification notes; do not present it as live integration evidence.

Confirm titles and primary action match the current image/video task and supported model. Explain the actual reference role. Keep an understandable relationship between outputs and their prompts/settings. Ensure loading preserves layout, errors preserve work, download gives feedback, and reduced-motion preferences are respected. Remove dead controls or implement their promised behavior within the agreed scope.

## Prioritize and finish

Fix confusing task flow, hidden actions, inaccessible controls and layout failures first. Then improve consistency, visual balance and restrained state transitions. Avoid excessive blur, decorative animation, invented metrics, redundant confirmation dialogs or a new design language halfway through the build. Choose changes because they improve a creator's decisions or comfort.

Record before/after evidence for material improvements and tie product changes to the research where appropriate. Final design verification is based on rendered behavior, not a checklist copied from a skill. The designer and reviewer must distinguish checked states from untested ones.

Root reviews integration, runs only the checks affected by changes, commits work with current authentic logs, pushes and deploys. Update the design brief and acceptance/status with actual evidence and any limitations. Preserve time for final verification and the camera-on recording. Once the implemented core screens and states meet the agreed quality bar, continue to Phase 6 without routine approval.
