# Sources and provenance

## Assignment authority

- User-supplied 8x assignment brief, received 11 October 2026. Deadline: 12 October 2026, 23:04 UTC. Requirements in docs/PROJECT-BRIEF.md come from that brief.
- [8x Agent Capture Setup](https://8x-internal.com/p/8x-agent-capture-setup). Copy its complete current original prompt as the first message of the fresh coding session. This kit deliberately does not substitute an edited reproduction.

## Current technical reference

- [Official Codex hooks documentation](https://learn.chatgpt.com/docs/hooks). Inspected during preparation. The installed build client, actual field coverage, hook trust, and independent-session behavior must still be tested locally.

## Original product research

- [Higgsfield homepage](https://higgsfield.ai/).
- [Image creation](https://higgsfield.ai/ai/image?model=gpt_image_2).
- [Video creation](https://higgsfield.ai/ai/video?model=seedance_2_5).
- [Account and Assets guide](https://higgsfield.ai/creator-hub/help-center/getting-started/whats-in-my-higgsfield-account).
- [Canvas guide](https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-canvas).
- [Credits guide](https://higgsfield.ai/creator-hub/help-center/credits/how-credits-work).
- [Generation lifecycle and failures](https://higgsfield.ai/creator-hub/help-center/troubleshooting/generation-is-stuck-or-failed).

Three public screenshots were taken during preliminary research on 11 October 2026. They document signed-out page states only. Both creation paths reported authentication_required. No generation was submitted, credits spent, account created, or signed-in flow completed. See docs/RECON.md and docs/recon/screenshots/.

## User's design skill

Apple Design was unavailable in the earlier preparation environment. Local Codex subsequently read the actual installed `apple-design` skill at `/Users/arhaan/.codex/skills/apple-design/SKILL.md`; its use is recorded in `docs/DESIGN-BRIEF.md` and the independent coverage review. Final tokens and implementation review remain Phase 2+ work.

## Starter provenance

This is pre-build preparation produced in ChatGPT. It contains plans, plain agent briefs, templates, and public research evidence. It contains no installed logger, canary output, product implementation, or verified live deployment. Do not relabel this material as automatically captured local build history.

## Local execution added 2026-10-12 UTC

- `docs/recon/flows.md` records current signed-in interactions; screenshots 04 onward are new local evidence. User completed sign-in and explicitly kept spending disabled.
- `docs/recon/coverage-review.md` contains the reviewer’s dated primary-source links and unresolved major branches. These are documentation evidence unless paired with an actual flow result.
- `docs/recon/integration-preflight.md` contains the backend’s dated official fal, Supabase and Vercel sources; capabilities/pricing are documentation, not live generation/deployment verification.
- `docs/agents/ASSIGNMENTS.md` records root’s acceptance and additional Vercel HTTP403 result.
