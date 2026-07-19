# Dala Runtime Migration Specification

## Overview

- **Target:** the local exact Dala clone at `/Users/ming.ma/Downloads/moritz/dala-clone`
- **Interaction model:** ASScroll-smoothed scrolling, GSAP scroll triggers, time-driven WebGL, click-driven project carousel
- **Goal:** preserve Dala's original DOM hooks, CSS, geometry, scripts, models, textures, and transitions while replacing product copy with Ming Ma's academic content.

## Runtime contract

- Preserve `[asscroll-container] > main`, fixed `<canvas id="canvas">`, `.js-section`, `section-name`, `anchor-target`, `anchor-link`, `animate-from`, `animate-mq`, and `dom2webgl` hooks.
- Load `/scripts/manifest.js`, `/scripts/vendor.js`, and `/scripts/theme.js` in that order after hydration.
- Use the original `py-lod*.glb`, `sc-33.png`, `cd-33.png`, noise, depth-of-field, sprite, and pyramid assets without modification. Replace only the landing target in a derived EXR position atlas.
- Import the original minified Dala stylesheet after Tailwind so measured desktop/mobile geometry remains intact.

## Content mapping

1. Landing: Ming Ma identity, portrait, affiliation, ERC project, research agenda, research/email CTAs.
2. Introduction: technology, institutions, and contestability statement.
3. Three narrative panels: administrative encounters, AI decisions, and cross-border narratives.
4. Manifesto one: AI and administrative service encounters.
5. Manifesto two: authoritarian narratives and generative AI.
6. Team carousel: three current research projects using their real imagery and external link where available.
7. Investors grid: selected publications and publication metadata, using original desktop WebGL pyramids.
8. Footer: collaboration CTA, email, CV, social link, and personal copyright.

## Native hero robot

- The landing robot is stored in quadrant zero of a derived Dala position atlas.
- The original WebGL InstancedMesh, glyph, color/scale textures, spring FBO, pointer response, and post-processing render it from the first frame.
- The page contains one canvas and performs no opacity handoff.
- Dala's original scroll thresholds morph the robot directly into later native targets.

## Responsive behavior

- Desktop uses the original 1366px+ Dala geometry and 150rem headline scale.
- Mobile uses the original 768px breakpoint, mobile menu, condensed narrative flow, and aggressive particle cropping.
- The project carousel keeps the original repeated-slide runtime contract.

## Acceptance criteria

- Dala loader reaches `.loaded` and fades to opacity zero.
- Root runtime classes and WebGL canvas dimensions are populated after load.
- Wheel input produces ASScroll-transformed content and the original particle sequence.
- Project carousel previous/next controls move the repeated strip.
- No custom Canvas2D particle world or hero overlay is mounted.
- Ming Ma's identity, all three projects, selected publications, CV, email, and social contact remain reachable.
