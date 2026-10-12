# Codex team operating agreement

These files are plain task briefs for real Codex subagents. They do not register agents, install skills, or prove that delegation is available. Starter-kit content is preliminary planning, not evidence that research, capture, or implementation has happened.

## Goal and gates

Deliver a public, usable cinematic creation studio and a public repository that explain the work honestly. The intended journey is reference image → real video generation → inspect → revise → download; add text-to-image as the connected starting step. Preserve a recognizable Higgsfield creative experience while improving a specific, observed interaction.

The coordinator verifies automatic capture in two genuinely separate sessions, plus coverage of delegated prompts and final responses, before spawning production workers. After the parent capture tests pass, a minimal child canary may run solely to establish delegated capture; it must do no production work. Do not hand-author transcript entries, relabel one session as two, or treat a coordinator summary as a child's transcript. If child capture is unsupported, resolve it before delegating. Independent coordinator work can continue within the other gates.

Application code requires both verified capture and the signed-in reconnaissance gate from the phase packet. Repository administration, capture setup, and preliminary planning documents are the permitted setup work. Do not mark a blocked research flow completed. Missing access remains an explicit dependency.

Evidence gates advance automatically when satisfied. Do not request routine stage approvals. Pause only the action that needs an exact unavailable dependency, authority, or capability; continue useful independent work.

## Coordination and ownership

Use one coordinator and at most three simultaneous workers. The five role briefs are a roster, not five concurrent agents. Workers must not spawn further agents without a slot and explicit coordinator assignment. Use supported local Codex delegation; never invent a tool or agent configuration. Inherit the available model unless the actual environment or user instructions justify a different selection; report the real model in capture.

Only the coordinator changes scope, assigns paths, integrates branches, commits, pushes, creates the repository, and deploys. It owns root configuration, dependency manifests/lockfiles, shared contracts such as `src/contracts/**`, capture configuration, and phase status. Log files are written by the verified capture mechanism, never manually by workers.

The proposed ownership below is adapted once the stack is chosen. The coordinator must publish exact current paths before each delegation. No overlapping writers, including seemingly harmless formatting changes. A worker requests a shared change with a proposed patch and waits for its owner; it continues independent work meanwhile. Preserve unrelated changes. One owner performs schema migrations and dependency changes. Do not let two workers operate the same browser session.

Suggested allocation:

| Stage | Parallel worker roles |
|---|---|
| Research | Researcher; Reviewer for evidence inventory; Backend for read-only runtime/integration preflight |
| Decisions | Designer; Researcher for prioritization; Backend for architecture/contracts proposals |
| Implementation | Frontend; Backend; Designer within assigned style paths |
| Release | Reviewer; Frontend and Backend only for separately assigned repairs |

## Delegation prompt template

```text
Act as [ROLE]; read docs/agents/TEAM.md and docs/agents/[ROLE].md.
Task ID: [unique identifier]. Phase: [number].
Outcome and user value: [one concrete deliverable].
Verified gates and evidence: [capture, child capture, reconnaissance, applicable design gate].
Required inputs: [actual files, contracts, observations].
You may write only: [exact exclusive paths].
Read-only dependencies and owners: [paths → owner].
Acceptance criteria: [observable outcomes].
Budget and priorities: [time allowance, essential work, optional work].
Coordinate through the coordinator; do not commit, deploy, or change scope.
Return the exact handoff schema below; surface blockers promptly.
```

## Required handoff schema

```yaml
task_id: ""
role: ""
status: complete | partial | blocked | failed
summary: ""
changed_files: []
capture:
  session_id: ""
  log_path: ""
  coverage_status: verified | unresolved
evidence:
  - claim: ""
    method: ""
    observed_result: ""
    artifact_or_source: ""
verification:
  - check: ""
    result: pass | fail | not_run
    detail: ""
decisions_and_tradeoffs: []
unverified_claims: []
blockers:
  - dependency: ""
    owner: ""
    exact_required_action: ""
    independent_work_remaining: ""
next_dependency: ""
```

Use empty arrays when appropriate. Distinguish proposed behavior from observed behavior. Completion requires the assigned acceptance criteria and supporting evidence; a screenshot alone does not prove a backend operation.
