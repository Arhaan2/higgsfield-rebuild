# Higgsfield rebuild: working agreement

## Mission

Build a publicly accessible, polished creative studio for the 8x software engineering assignment. A creator should move from a prompt or reference image to a cinematic clip, inspect the result, revise it, and download the preferred version. Research Higgsfield first, then justify a focused implementation and specific UX improvements. Preserve evidence of decisions and authentic agent use. This starter kit is preparation; it is not a working application or a completed audit.

## Required gates

1. Follow the full official capture guide as the first message in a fresh local Codex session. Inspect the installed client's actual capture capabilities; this kit supplies no hook implementation.
2. Prove automatic capture with the guide's two canaries in separate sessions, without reinstalling between them. Local Codex must create root `CAPTURE-TEST.md` from actual evidence. The template under `docs/templates/` is explicitly unexecuted.
3. Complete the signed-in product investigation required by the assignment, including screenshots and end-to-end results. Distinguish completed, observed, blocked, and documentation-only findings. An inaccessible required flow remains unresolved; do not silently waive it or declare the research gate passed.
4. Begin application implementation only after capture and research gates pass. Necessary repository and capture setup may occur beforehand.

Never create synthetic capture entries, invent verification results, or present earlier unrecorded planning as captured work.

## Phase 0: repository setup

The user authorizes local Codex to create the public GitHub repository `higgsfield-rebuild`, build the application, and make the associated commits and pushes. Do not request the same authorization again. Verify the authenticated GitHub identity first; use `Arhaan2` only if authentication confirms access to that identity. Inspect any name collision and preserve existing work; never overwrite or delete an existing repository. Resolve account ambiguity before creating the remote.

The extracted higgsfield-rebuild folder is the prepared project working directory, not yet an initialized GitHub repository. Phase 0 initializes and connects this same directory after checking its contents and the authenticated account. Do not move the project or change the configured capture destination without verifying capture again. Do not manufacture `package.json`, CI results, or an application merely to make the scaffold appear complete. Choose the real stack after inspecting the environment and completing research.

## Capture integrity

- Keep `.agent-logs/` tracked. Let the verified capture mechanism create its contents; put no explanatory README or placeholder entries there.
- Preserve full raw prompts and final responses with UTC timestamps and the actual model identifier, following the official format. Do not include reasoning or intermediate tool traffic.
- Never hand-edit, normalize, summarize, reconstruct missing exchanges, or squash raw logs. A supported extraction from genuine source transcripts must preserve their actual content and provenance; it cannot fabricate earlier capture. Commit them incrementally with meaningful work; retain that history.
- Verify capture coverage for child agents and any worktrees before production use. Once the coordinator passes its required capture tests, a minimal child session may run solely to test delegated capture, with no production task. Production delegation starts only after its actual prompt and final response are verified in the submitted log destination. Use a supported, tested mechanism or separate verified logged sessions. If coverage cannot be demonstrated, perform the work in the verified main session until resolved.
- Check the real log destination for every session. Prevent overlapping agents from writing the same session file or leaving logs outside the submitted repository.
- A final response can be logged after the agent's last commit. Finish by giving the user terminal commands to inspect, commit, and push that remaining capture after the agent stops. Do not claim the repository includes a response that has not yet been emitted and committed.
- Keep credentials out of prompts and responses. An accidentally captured secret requires resolution before a public push; do not silently alter the evidence.

## Design

The user has installed an Apple Design skill in their local Codex environment. Discover its actual installed name and location, read it, and apply its relevant guidance. Do not presume invocation syntax, fabricate the skill, or claim to have used it without reading it. Keep the product identity appropriate for a cinematic creative studio. Record design choices against research observations and make every exposed control meaningful.

## Ownership and delegation

The root coordinator owns scope, shared contracts, dependencies and lockfiles, shared application configuration, integration, capture configuration, commits, pushes, and deployment coordination. Specialists receive explicitly assigned file paths; they must not edit another agent's files or change shared interfaces without a coordinator handoff.

Give each task a goal, inputs, owned paths, exclusions, interface contract, acceptance criteria, verification method, time allowance, and return format. Use docs/templates/AGENT-HANDOFF.template.md to assign the task and the canonical YAML schema in docs/agents/TEAM.md for its return. Research reports observations; design owns assigned design specifications, tokens and style paths; frontend owns components unless root explicitly transfers those paths; implementation specialists own assigned UI or server paths; verification independently checks the integrated product. Parallelize independent tasks only after shared contracts and capture coverage are established. Specialists report changed files, actual checks, remaining issues, and requested integration changes; only the coordinator commits and pushes.

## Product and operational honesty

Implement genuine generation where configured. Label prepared samples and simulated behavior explicitly. Preserve drafts on errors, make pending states honest, and test reload, reuse, playback, and download. Do not claim every Higgsfield feature is implemented.

The paid generation allowance is unset. Live generation starts disabled with a zero budget; repository/build authorization does not authorize spending. Configure a provider and an explicit cap before making billable requests. Proposed environment variable names must match the eventual implementation. Keep secrets server-side and out of source control.

Update the project checkpoint after every phase with actual status, changed files, verification evidence, unresolved dependencies, and the next action. Never mark a phase complete solely because an agent reports success; check its acceptance evidence. Keep documentation concise and tied to decisions or verification.
