# Browser Feedback Polish Specification

## Overview

- **Target:** the existing Dala portfolio homepage and `/publications` archive.
- **Interaction model:** ASScroll-driven four-stage WebGL morph, native pointer response, disclosure clicks, and split-text footer entrance.
- **Reference viewport:** browser comments at `973x770`; verify additionally at `1440x730`, `768px`, and `390px` widths.
- **Runtime contract:** retain one fixed `<canvas id="canvas">`, 10,000 desktop particles, native spring simulation, and existing document-navigation boundaries.

## Approved visual changes

### About

- Biography computed color changes from `rgba(236, 232, 224, 0.82)` to `#fff`.
- Shorten the generated robot ponytail so its visible end reaches the middle of the neck.
- Preserve the face, visor, ear, neck, and shoulder silhouette.

### Project

- Current desktop title is displaced by two top offsets: section padding plus sticky `top`, producing `264px` at `1440x730` and about `224px` at `973x770`.
- Set desktop sticky top offset to `0`; the heading and project list begin on the same horizontal line.
- Use the exact X-axis mirror of the About robot and make the stable silhouette face right.
- Remove stable-state tilt so the Project figure is as legible as the About figure.
- Desktop/tablet target zone: X `0-42%`, Y `25-95%`; place the figure below the heading and outside the right project column.
- Keep the figure visually strong in a clear left foreground zone; text must not overlap it.

### Publication

- Use the same zero sticky offset so the heading aligns with the first ledger divider.
- Replace the rectangular page cloud with a recognizable open book: two page surfaces, outer edges, center gutter, curved page contours, and shallow depth.
- Desktop/tablet target zone: X `4-42%`, Y `50-92%`.
- The left/lower background remains transparent enough for the book to be obvious; the right ledger retains a dark readability gradient.

### Publication content

- Change the first article authors to `Ma Ming and Yi Kang` in the canonical content source.
- Remove every explicit `Permalink` / `Permalink #` action from the homepage and `/publications`.
- Preserve publication record IDs and archive title hash links so existing anchors remain valid.

### Footer

- Treat the heading and Contact button as one CTA group.
- Center the CTA group horizontally and vertically in the particle area above the footer bar.
- The computed title and generated split-text wrapper widths must share the same centered axis.
- Preserve the existing natural two-line wrap at `973px`; do not force a desktop single line.

## Particle and layering behavior

- Keep the canvas non-interactive and retain the original spring, pointer, bloom, and depth-of-field pipeline.
- Map target selection, explosion, rotation, and position to the same four stable stages: About `0`, Project `1`, Publication `2`, Contact `3`.
- About stays on the right, Project settles in the independent left foreground zone, Publication settles lower-left, and Contact keeps the source brain target.
- Use section-specific horizontal gradients instead of an opaque full-section Publication overlay.
- On mobile below `768px`, keep the canvas behind content with reduced visual competition; headings return to normal document flow.

## Generated asset contract

- The position atlas stays `200x200`, four `100x100` quadrants, exactly 10,000 XYZ points per target.
- About and Project remain deterministic order-preserving mirrors (`project.x = 1 - about.x`, identical Y/Z).
- The long-ponytail-only region below the neck cutoff contains no robot samples.
- The book includes dense samples on both page edges and both sides of the gutter without filling the crease.
- The Contact quadrant remains byte-for-byte equal to the source brain quadrant.

## Acceptance criteria

- No visible text matching `Permalink` remains on either route.
- Project and Publication heading tops align with their right-column content at desktop/tablet widths.
- Project clearly faces right, occupies only the left zone, and does not obscure the heading or records.
- Publication book is immediately recognizable in the lower-left zone.
- About biography is pure white and the ponytail ends at mid-neck.
- Footer CTA group is centered above the footer bar, including after split-text initialization.
- Detail disclosures still refresh ASScroll layout; publisher links, CV, email, and navigation still work.
- One WebGL canvas is present, all particle assets load, and reduced-motion behavior remains safe.
- Atlas verification, unit tests, lint, typecheck, production build, and four-viewport visual QA pass.

## Round 2 refinement — 1109x770 browser feedback

### About braid silhouette

- The source crop contains one continuous rear hair mass, so shortening alone is insufficient.
- Remove the rear hair mass outside a dedicated braid envelope from normalized rows `0.13-0.60`.
- Leave a visible negative-space channel between the back of the head and the braid from normalized columns approximately `0.65-0.735`, wide enough to survive particle scatter and bloom.
- Shape the retained braid with several subtle width lobes and taper its half-width from roughly `0.07` near the top to `0.012` at the tip.
- Preserve the existing face, visor, jaw, neck, and shoulders. The braid tip still ends near mid-neck.

### Project and Publication vertical rhythm

- Current `1109px` desktop values: section top padding is about `111px`; the shared act title is about `68.8px`.
- Desktop/tablet target: use `padding-top: clamp(5.5rem, 7.5vw, 8rem)`, yielding about `83px` at `1109px` and moving both title and right-column content upward together.
- Shared act title target: `clamp(2.75rem, 5.2vw, 5.5rem)`, yielding about `57.7px` at `1109px`.
- Project and Publication must use the same title size and top alignment. Mobile document-flow spacing remains unchanged.

### Publication book refinement

- Reduce the generated book target from almost full normalized width/height to approximately X `0.26-0.74` and Y `0.33-0.68`.
- Retain two clearly separate pages with a narrow center crease.
- Shift particle allocation away from flat page fill toward outer edges, curved top/bottom outlines, gutter edges, shallow page thickness, and internal page contour lines.
- The smaller book must remain immediately identifiable in the lower-left at `1109x770`, without obscuring the publication ledger.

### Round 2 verification

- Reference viewport: `1109x770`; additionally verify `1440px`, `768px`, and `390px` widths.
- The braid is visibly separated from the head and its lower width is less than half its upper width.
- Project and Publication titles use identical computed font sizes and their title/list tops remain aligned.
- The book is smaller than the prior target but has stronger page-edge and gutter definition.
