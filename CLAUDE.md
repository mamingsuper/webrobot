# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This is the active Ming Ma academic portfolio, combining real research content with the vendored Dala visual/WebGL runtime. Do not confuse it with the sibling template and prototype directories under `/Users/ming.ma/Downloads/moritz`.

Read `PROJECT_STATUS.md` before changing behavior. It is the source of truth for completed work, current P0/P1 issues, and acceptance criteria. Also follow `AGENTS.md`; for Next.js changes, consult the installed Next.js 16 documentation under `node_modules/next/dist/docs/` rather than relying on older framework conventions.

## Commands

Node.js 22 or newer is required.

```bash
npm run dev        # Start the Next.js development server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript without emitting files
npm run build      # Create a production build
npm run start      # Serve the production build
npm run check      # Run lint, typecheck, and production build
```

There is currently no unit, integration, or Playwright test suite, so there is no single-test command. `npm run check` is static/build verification, not automated browser testing.

Regenerate and apply the native robot particle target with:

```bash
python3 scripts/generate-native-robot-texture.py
node scripts/patch-dala-runtime.mjs
```

The generator additionally requires Python 3, NumPy, Pillow, SciPy, and FFmpeg. It deterministically writes `public/images/pos-ming-robot-v1.exr` and preserves the other three Dala target regions.

## Architecture

- `src/app/page.tsx` is a thin composition layer for the immersive homepage. It renders semantic React sections inside the ASScroll container, followed by the single `ParticleCanvas` and `DalaRuntime`.
- `src/app/publications/page.tsx` is a separate server-rendered publication archive with metadata and ScholarlyArticle JSON-LD; it intentionally does not load the WebGL runtime.
- `src/components/dala-portfolio/` contains the React structure that preserves Dala's DOM classes, attributes, section boundaries, and runtime hooks.
- `src/data/content.ts` is the canonical source for biography, updates, research projects, publications, CV, and contact links.
- `src/app/dala-original.css` and the portfolio styles preserve the cloned Dala layout and responsive behavior. The project uses a mix of CSS files/modules and Tailwind; do not enforce a Tailwind-only rewrite.
- `public/scripts/manifest.js`, `vendor.js`, and `theme.js` are vendored, minified Dala runtime artifacts loaded in that order by `DalaRuntime`. Treat them as generated/vendor code rather than normal application source.
- `scripts/patch-dala-runtime.mjs` is the supported narrow mechanism for changing resource URLs in the minified runtime. Avoid hand-editing or broadly reformatting `public/scripts/theme.js`.
- `scripts/generate-native-robot-texture.py` converts `robot-source.png` into exactly 10,000 deterministically ordered 2.5D points stored in the first quadrant of the 200×200 EXR atlas.
- `docs/research/` records design tokens, page topology, runtime behavior, component specifications, and QA findings. `docs/design-references/` contains visual references and captures.

## Runtime invariants

- The homepage must have one primary WebGL canvas. Do not reintroduce the removed Canvas2D robot overlay or cross-fade between canvases.
- The robot must be rendered through Dala's original particle geometry, Position/Velocity FBO simulation, shaders, and post-processing.
- Preserve the seven original `.js-section` boundaries and runtime-facing DOM hooks unless the corresponding scroll/WebGL assumptions have been investigated.
- The current four-slot atlas maps the robot to slot one and retains Dala's remaining three targets. Adding the removed original brain as a fifth state requires coordinated atlas, shader, UV, FBO, and scroll-formula changes.
- `theme.js` has no stable public API. Any replacement of the upstream bundle must be checked against the patch script's expected strings and all runtime asset requests.

## Current verification boundary

Historical project records say lint, typecheck, build, deterministic EXR generation, and asset-level checks passed. The remaining release blockers are browser visual acceptance of the latest EXR, particle transitions and overflow checks at 390/768/1440 widths, and performance testing on real iPhone and Android devices. Re-run relevant checks before claiming current success; do not treat historical results as fresh verification.
