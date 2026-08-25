# Lecture choreography patterns

Choose a pattern based on the teaching objective; do not add motion merely for decoration.

## Context → path → consequence

Use for request lifecycles and distributed systems:

1. Reveal the system boundary and actors.
2. Trace one edge at a time in causal order.
3. Focus the component currently responsible.
4. Clear the previous focus before moving on.
5. End on the resulting state or failure boundary.

## Invariant → operation → restored invariant

Use for algorithms and data structures:

1. State and focus the invariant.
2. Reveal or trace the operation.
3. Highlight the temporary violation.
4. Show the corrective step.
5. Return focus to the restored invariant.

## Compare two paths

Use for cache hit/miss, success/failure, or before/after:

1. Establish shared context.
2. Trace the first path and narrate its cost.
3. Clear transient emphasis.
4. Trace the second path with a distinct scene, not simultaneous noise.
5. Fit the camera to both outcomes for comparison.

## Projection and narration checks

- Prefer 3–7 visible concepts per teaching beat.
- A scene normally has one primary change; a short `sequence` may reveal a tightly coupled pair.
- Keep narration to one comfortable spoken unit per scene. After speech generation, set the scene to at least the measured audio duration plus 800ms; split the scene when that would make one cue feel slow or visually overloaded.
- Check the first and last 250ms of every cue. A camera move, label, arrowhead, or subtitle must not be clipped during either transition state.
- Do not pulse or repeatedly highlight every node. Motion should signal causality, state transition, or comparison.
- The final frame should remain useful while the instructor answers questions.
