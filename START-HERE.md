# Start here: Higgsfield rebuild with Codex

This is a prepared execution kit for Arhaan Aggarwal's 8x software-engineering assignment. It contains planning, prompts, role briefs, configuration examples, and preliminary public screenshots. It contains no application implementation, fabricated capture log, passed test, or completed deployment.

**Deadline:** 12 October 2026, 23:04 UTC / 4:04 p.m. America/Los_Angeles. Suggested submission-ready target: 2:00 p.m. Pacific. The brief says the clock is tracked but not enforced; retain the stated deadline as the working target.

## Start in the right order

1. Extract the archive. Open the extracted `higgsfield-rebuild` folder in your actual Codex installation. This same folder becomes the project repository during Phase 0; it is not yet initialized. Keep all dotfiles, and do not move the capture destination without verifying it again.
2. Open the [official 8x agent-capture guide](https://8x-internal.com/p/8x-agent-capture-setup). Copy the **entire original setup prompt** from that page into a **fresh Codex session as its first message**. The files in this kit do not replace that first message.
3. After that first exchange, send the full contents of [Phase 0](docs/prompts/00-setup.md), or ask Codex to read that file and execute it. Phase 0 completes capture/repository administration and verifies the two independent sessions required by the official guide. Actual product code must wait.
4. Use the subsequent phase files in order. Their evidence gates determine readiness. The main Codex thread is the coordinator; it creates specialists with the briefs in `docs/agents/`.
5. You may send one phase at a time or use the continuation prompt below after Phase 0. Routine completed gates do not need your approval again.

Preferred public repository: `Arhaan2/higgsfield-rebuild`. Your local Codex must verify its own authenticated account and inspect any existing repository before using that name. Codex creates and connects the repository in Phase 0. Do not overwrite an existing project or invent a repository URL.

## Continue through the phases

After capture is actually verified, this is a complete continuation instruction:

> Read AGENTS.md, docs/PROJECT-BRIEF.md, docs/WORKFLOW.md, docs/STATUS.md, and docs/agents/TEAM.md. Determine the next incomplete phase from evidence and execute its prompt in docs/prompts. Continue through later phases when their gates pass; do not wait for routine phase approval. Use the defined subagents with exclusive path ownership. Preserve automatic capture and incremental commits. Ask me only for a concrete missing prerequisite, such as required authentication, a missing local skill, or a spending decision. Keep independent authorized work moving. Do not claim completion for a gate you cannot prove.

## Phase map

| Phase | Purpose | Prompt |
| --- | --- | --- |
| 0 | Repository, automatic capture, real canaries, skill and access preflight | [00-setup.md](docs/prompts/00-setup.md) |
| 1 | Signed-in product investigation and evidence | [01-reconnaissance.md](docs/prompts/01-reconnaissance.md) |
| 2 | Product scope, Apple Design, architecture and contracts | [02-product-design.md](docs/prompts/02-product-design.md) |
| 3 | First public deployment and real image-to-video workflow | [03-first-working-flow.md](docs/prompts/03-first-working-flow.md) |
| 4 | Image creation, reuse, persistence and complete creative loop | [04-complete-product.md](docs/prompts/04-complete-product.md) |
| 5 | Design refinement and responsive interaction quality | [05-design-polish.md](docs/prompts/05-design-polish.md) |
| 6 | Independent verification and focused repairs | [06-verification.md](docs/prompts/06-verification.md) |
| 7 | Final evidence, repository, walkthrough and submission package | [07-delivery.md](docs/prompts/07-delivery.md) |

## What you need to provide when it becomes necessary

- Your authenticated local GitHub/Codex environment.
- Access to Higgsfield for the required signed-in investigation. Complete signup or security challenges through the supported user-facing flow.
- The installed Apple Design skill. Codex must find and read the actual skill; this chat could not inspect it.
- A working generation provider and a spending limit for any paid tests. Enter secrets through local environment/provider controls, never public prompts or logs. A zero default in the example environment authorizes no spending.
- Your real camera-on recording, under five minutes. The agent can prepare the demo and script; you record the walkthrough.

## Most useful files

Start with the [project goal](docs/PROJECT-BRIEF.md), [team rules](docs/agents/TEAM.md), [phase workflow](docs/WORKFLOW.md), and [current status](docs/STATUS.md). Read the longer technical/design files when their phase starts. Templates are not completed evidence.

## Provenance

This kit was prepared in ChatGPT on 11 October 2026 before the recorded local Codex build. Its three screenshots are public, signed-out observations. Neither a captured implementation session nor signed-in end-to-end testing occurred in creating this kit. Carry this context honestly into the recorded build. Do not reconstruct earlier exchanges as if the hook had captured them.
