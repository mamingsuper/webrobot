# Native Dala Robot Particle Specification

## Overview

- **Target runtime:** `public/scripts/theme.js`, Dala particle class `an` in webpack module `2601`
- **Generated asset:** `public/images/pos-ming-robot-v1.exr`
- **Generator:** `scripts/generate-native-robot-texture.py`
- **Interaction model:** time-driven entrance, pointer-reactive motion, and ASScroll-driven GPU morph
- **Visual target:** the approved side-profile humanoid robot rendered by the exact Dala InstancedMesh, spring FBO, material, depth pass, bloom, and depth-of-field pipeline

## Native runtime contract

- Keep exactly one visible full-viewport canvas: `<canvas id="canvas">`.
- Remove the independent Canvas2D `HeroRobotOverlay` and every opacity crossfade between canvases.
- Preserve Dala's 10,000 desktop / 7,000 mobile triangle instances.
- Preserve the low-poly triangle glyph from `py-lod7.glb` and the original `sc-33.png` scale and `cd-33.png` color textures.
- Preserve the original 200×200 position-texture layout. Each 100×100 quadrant contains one 10,000-particle XYZ target in normalized 0–1 coordinates.
- Replace only quadrant zero, the original landing brain target, with the side-profile robot target. Leave quadrants one through three byte-for-byte unchanged.
- Preserve the original GPU simulation, including the position FBO, spring/velocity FBO, pointer displacement, rotation, explosion, camera, composer, depth material, and post-processing.

## Robot target generation

- Source: `public/images/robot-source.png`.
- Crop: x `660`, y `66`, width `876`, height `958`.
- Generate exactly 10,000 stable particles from the robot silhouette.
- Weight sampling toward high-contrast contours while retaining enough interior density for the visor, face, neck, shoulder, tied hair, and long descending ponytail to remain legible.
- Normalize X/Y into the same 0–1 coordinate convention used by the original EXR position texture.
- Add restrained depth from luminance plus deterministic micro-jitter so the result reads as a volumetric 2.5D humanoid rather than a flat cutout.
- Sampling must be deterministic across reloads.

## Native states and behavior

### Entrance

- Use Dala's existing three-second `u_show` animation and base rotation tween.
- No CSS fade-in or raster underlay.

### Pointer response

- Use Dala's existing `u_mouse`, `u_delta`, simplex-noise rotation, and camera easing without a parallel listener.

### Scroll transition

- Keep Dala's existing ASScroll-derived `sectionProgress` mapping, spring target updates, friction, and morph easing.
- Robot particles must travel to the next native target through the GPU spring simulation; they must not dissolve into a separately rendered object.
- There must be no frame where two particle canvases overlap.

## Layout optimizations

- Desktop landing preserves Dala's headline scale and keeps the robot clear of the primary identity column.
- Hero copy is concise enough to remain above the fold; the detailed biography continues in the following introduction section.
- Project carousel content must not reveal inactive descriptions outside the active state.
- Publication titles must remain readable without clipping the WebGL pyramids.
- Mobile keeps the native canvas and Dala navigation; no backdrop filter may blur the robot target.

## Acceptance criteria

- DOM contains one canvas after loader completion.
- The visible robot is rendered by Dala's WebGL renderer, not Canvas2D or an image element.
- Runtime retains 10,000 desktop particle instances and native Dala post-processing.
- Scrolling produces spring-driven geometric travel rather than an opacity crossfade.
- No missing model, texture, or image requests on desktop or mobile.
- Desktop 1440px, tablet 768px, and mobile 390px visual checks pass.
- `npm run check` passes.
