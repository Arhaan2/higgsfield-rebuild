# Design brief — starting proposal

**Not an executed design review.** Read the actual installed Apple Design skill in Phase 2 and update this document from the signed-in research. The following goals belong to this project; they are not attributed to an unseen skill.

## Intent

Make one creative task easy to begin and satisfying to finish. Media should dominate the workspace, and controls should make the next decision clear. Preserve a cinematic identity with coherent dark surfaces, readable type, restrained bright emphasis, strong previews and deliberate spacing. Decide the actual system once; refine it during implementation rather than restarting the visual direction.

## Required skill evidence

Record the skill's real name, full locator, version if present, relevant instructions and any required reference files. Briefly connect the guidance to actual choices in hierarchy, navigation, controls, typography, states, responsiveness and motion. If the skill cannot be found, report that dependency and continue independent eligible work; do not invent a replacement and call it Apple Design.

Phase 0 resolution (11 October 2026): the coordinator read the installed `apple-design` skill at `/Users/arhaan/.codex/skills/apple-design/SKILL.md`. It declares no version and requires no separate reference files. Relevant guidance for the later design phase includes immediate press feedback, interruptible motion, clear spatial relationships, typography whose tracking/leading varies with size, and reduced-motion/transparency/contrast alternatives. These are intended constraints, not evidence of an implemented UI or completed design review. The user expressly directs automatic application without the skill's generic introductory pause.

## Proposed information architecture

- Explore provides a small, coherent set of starting looks, with meaningful preview and Use this look behavior.
- Studio contains the active project's prompt/references, supported controls, progress and primary output. Empty guidance should describe the selected mode/model.
- Library contains saved work, inspectable details, reuse and download.
- An asset detail view explains what produced the result and presents the next relevant action.

On a wide screen, a clear control region and generous output region can coexist. On a phone, order them around the current task and keep the main action reachable without obscuring content. Do not rely on hover for essential behavior.

## States to design before implementation

First visit; sample project; empty draft; uploaded reference; invalid upload; ready submission; submitting; pending; uncertain submission; success; failure with retained draft; unavailable model option; usage limit; saved history; restored variation; downloading.

## Reference and iteration clarity

Make the reference's supported role explicit. Explain an incompatible option before the user submits. Keep a visible association between outputs and their actual prompt/model/settings. A small version strip can explain what changed without introducing a node editor.

## Implementation quality

Use a small set of reusable tokens and component patterns. Make focus visible, forms labeled, text readable and motion optional where users prefer reduction. Use loading states that preserve layout. Reserve the strongest accent for the current action. Use consistent control sizing, spacing, alignment and typography. Include keyboard and touch behavior in the component contract.

## Visual evidence and acceptance

Capture the rendered core flow at a representative laptop width and narrow mobile width, plus empty/pending/success/failure states. Compare the implemented screen against the agreed design and report exact defects: clipped controls, inconsistent hierarchy, distracting overlays, weak contrast, ambiguous state, or unsupported actions. Review function as well as appearance. The Phase 2 gate accepts an evidenced design direction and specification. Final rendered design verification in Phase 5 is based on the actual application; these paragraphs do not prove it.
