# Behaviors

- The complete experience uses Dala's original ASScroll container, WebGL renderer, InstancedMesh geometry, spring simulation, depth pass, bloom, depth-of-field, and scene sequence.
- Exactly one fixed canvas renders both the landing robot and every later particle state.
- The landing robot is the first 10,000-point target in Dala's 200×200 floating-point position atlas. It uses the original triangle glyph, scale texture, color texture, camera, and material.
- Dala's original three-second `u_show` sequence assembles the robot on entrance.
- Pointer movement uses Dala's native camera easing, local particle displacement, simplex-noise rotation, and velocity response.
- ASScroll-derived `sectionProgress` drives the native target morphs. Position and velocity ping-pong FBOs apply spring `0.006` and friction `0.892`, so particles travel between shapes instead of crossfading.
- The original header collapses its wordmark and adds the native blur treatment after scrolling.
- Research projects use Dala's repeated inertial carousel and original controls with shortened display copy; the complete project copy remains elsewhere in the page content.
- Publications use the original investors grid and desktop `dom2webgl="c:Pyramid"` hooks. Full titles remain in the archive outside that grid.
- Mobile uses the same WebGL canvas, the first 7,000 deterministically shuffled robot points, the original menu, and the original readability veil.

## Browser feedback refinement — 2026-07-13

- At desktop/tablet widths, Project and Publication share the same title scale and section padding. Their heading and right-column list tops remain exactly aligned through the sticky ASScroll states.
- At `1109x770`, both titles compute to `57.668px` with a top position of `83.172px`; at `1440x800`, they cap at `66px` with a top position of `96px`.
- The About robot now keeps a deliberate negative-space channel between the rear head silhouette and a separately tapered braid. The Project robot remains its order-preserving horizontal mirror.
- The Publication target is a compact open book with two page surfaces, a clear center crease, curved outer contours, internal page lines, and edge-weighted particle sampling.
- At `390x844`, headings return to relative document flow, the Project title computes to `33px`, and the document has no horizontal overflow.
