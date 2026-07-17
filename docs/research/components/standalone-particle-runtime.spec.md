# Standalone Particle Runtime Specification

## Objective

Replace the vendored Dala runtime with a first-party WebGL2 particle experience while preserving the approved academic portfolio composition and four-stage visual language.

The runtime must be independently owned by this repository: no vendored Dala JavaScript, ASScroll, GSAP, Dala shaders, Dala CSS, Dala EXR atlas, Dala models, or Dala post-processing textures may remain after final acceptance.

## Design context

- **Audience:** academic peers, collaborators, research institutes, funders, journalists, and the interested public.
- **Use cases:** understand Ming Ma's research identity, explore projects and publications, open papers/CV, and make contact.
- **Tone:** rigorous, credible, internationally minded, editorial, and restrained retro-futurist—not an AI startup landing page.
- **Signature:** interactive solid low-poly tetrahedral glyphs in midnight ink, warm ivory, ultraviolet, deep teal, and archival amber.

## Runtime architecture

### Canvas and ownership

- Render exactly one fixed `<canvas id="canvas">` behind semantic content.
- The first-party React entry is `ParticleExperience`, a small Client Component mounted by the server-rendered homepage.
- Browser APIs, RAF, WebGL resources, listeners, and observers are created only inside the client boundary and disposed on unmount/context loss.
- Semantic content must remain fully usable when WebGL2 or float render targets are unavailable.

### Target asset

- Replace the EXR atlas with `public/particles/portfolio-targets.bin`.
- Binary header: ASCII magic `MPRT`, uint32 little-endian version `2`, stage count `4`, points per stage `10000`, components `12`; followed by stage-major little-endian float32 data.
- Each particle stores position `(x, y, z, seed)`, style `(scale, sRGB r, g, b)`, and behavior `(order, phase, wobble, speed)`. Position and metadata coordinates use normalized `[0,1]` space.
- Generator and verifier are first-party scripts with deterministic output and an inspectable PNG preview.
- Stage order is fixed:
  1. About: left-facing visor profile with separated tapered braid.
  2. Project: a left-side light bulb with a readable glass outline, filament, neck, and screw base.
  3. Publication: a compact shaded sphere/globe with latitude, longitude, and continental relief.
  4. Contact: particle planet with a spherical body plus a clearly separated tilted Saturn ring.

### GPU simulation

- WebGL2 only; require `EXT_color_buffer_float` for the animated path.
- Store position and velocity in two RGBA32F attachments on each of two ping-pong framebuffers.
- Update both attachments in one MRT fragment pass per frame.
- Spring target is the smooth blend of adjacent target textures; use deterministic transition turbulence and transition-only radial expansion.
- Use the measured Dala dynamics: spring `0.006`, friction `0.892`, hover radius `1.25`, and hover scale `0.75`.
- Start from deterministic scattered positions and use order-staggered quintic assembly into About over 3 seconds.

### Particle rendering

- Draw instanced 3D glyphs using a 20-position, 144-index, 48-face tetrahedral topology; do not use DOM particles, Canvas2D, screenshots, or multiple coordinated canvases.
- Desktop renders 10,000 instances; mobile/coarse-pointer quality may render the first 7,000 while keeping all stages spatially representative.
- Render a second layer of 250 larger glyphs with independent depth and pointer parallax.
- Stage placement is independent from target data and interpolates with scroll progress:
  - About: right side.
  - Project: left foreground.
  - Publication: lower-left.
  - Contact: centered behind the CTA.
- Pointer movement produces eased camera parallax plus a Dala-style local hover zone that enlarges, lightens, and subtly agitates nearby glyphs. Pointer clicks do not trigger a shockwave.

### Post-processing

- Render through Three.js `EffectComposer` using Bloom `(threshold .159, strength .4, radius 1)`, desktop Bokeh `(focus .125, focal length 27, f-stop 2509, max blur 10)`, and Vignette `(offset .3, darkness 4)` plus restrained procedural grain.
- Convert MPRT sRGB palette values to linear rendering space and apply the final sRGB output transform after post-processing.
- No old DOF/noise/scale/color textures are permitted in the final runtime.
- Cap DPR and resize allocations to avoid mobile memory spikes.

### Scroll and interaction director

- Use native document scrolling; no ASScroll transform container or vendored scroll library.
- Smooth only the runtime's stage progress with frame-rate-independent damping. Morphing starts at `.70`, expansion rises from `.72` to `.82`, recedes from `.90` to `1.00`, and placement follows the same morph window.
- Derive continuous progress from the four `[section-name]` section offsets and refresh on resize/`ResizeObserver`.
- Anchor controls use native `scrollTo` with smooth behavior unless `prefers-reduced-motion` is active.
- Update active navigation, header-scrolled state, mobile menu state, and section entrance attributes without GSAP.
- Use `IntersectionObserver` for one-time content entrances. Only transform/opacity may animate.

### Loader, health, and accessibility

- `ParticleExperience` dispatches typed progress, ready, and failure events.
- The React loader reflects those events and never blocks semantic content after a failure.
- `prefers-reduced-motion: reduce` disables spatial entrances, pointer repulsion, transition scatter, and continuous simulation; render the current target statically.
- Pause RAF when the document is hidden; resume safely when visible.
- Support WebGL context lost/restored without duplicate listeners.

## Temporary fallback and removal gate

During integration only, preserve the existing Dala files and expose `?runtime=dala` as a manual fallback. The default path must run the first-party runtime.

Delete the fallback only after all acceptance checks pass. Final cleanup removes:

- `public/scripts/manifest.js`, `public/scripts/vendor.js`, `public/scripts/theme.js`
- `src/components/dala-portfolio/DalaRuntime.tsx`
- `src/app/dala-original.css`
- `public/images/pos-33.exr`, `public/images/pos-ming-robot-v1.exr`
- legacy Dala particle textures/models that have no remaining references
- runtime patch scripts and tests that exist only for the vendored bundle
- EXR-specific generator/verifier code replaced by the new binary pipeline

## Agent interface contracts

### Renderer package

Export from `src/lib/particle-runtime/index.ts`:

```ts
export type ParticleEngineOptions = {
  canvas: HTMLCanvasElement;
  targetUrl: string;
  reducedMotion: boolean;
  onProgress?: (progress: number) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
};

export class ParticleEngine {
  constructor(options: ParticleEngineOptions);
  start(): Promise<void>;
  setStageProgress(progress: number): void;
  setPointer(x: number, y: number, active: boolean): void;
  resize(): void;
  setPaused(paused: boolean): void;
  destroy(): void;
}
```

The renderer validates the `MPRT` header and does not know about React or page selectors.

### Target generator

Own only target generation, binary encoding, preview generation, verification, and their tests/assets. It must not edit React, CSS, or renderer files.

### React/scroll/CSS integration

Own `ParticleExperience`, runtime events, scroll director, loader/header interaction, and standalone CSS foundation. It consumes the renderer contract and target URL but does not edit renderer internals or generator scripts.

## Acceptance criteria

- No vendored Dala scripts execute on the default path during temporary fallback testing.
- About, Project, Publication, and Contact morph continuously in the approved order.
- Contact is unmistakably a Saturn-like particle planet: spherical body, tilted detached ring, readable CTA.
- One canvas, one RAF owner, no Canvas2D particle layer, no duplicate document listeners.
- Pointer response, inertial GPU transitions, scroll navigation, mobile menu, disclosures, and semantic links work.
- Bloom/grain/vignette remain restrained and text contrast stays readable.
- Reduced motion produces a stable, non-spatial alternative.
- No horizontal overflow at `390`, `768`, `1109`, or `1440` widths.
- Browser console has no uncaught errors; WebGL context and target asset load successfully.
- Automated tests cover binary parsing, deterministic target generation, stage ordering, Saturn geometry, runtime lifecycle, scroll mapping, reduced motion, and final legacy-asset absence.
- `npm run check` and first-party target verification pass.
- After browser acceptance, the manual Dala fallback and all listed legacy files are removed, and the clean build/browser checks pass again.
