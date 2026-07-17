# Ming Ma — Research Portfolio

An immersive academic portfolio built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. It combines Ming Ma's real research content with a restrained Dala-inspired particle language.

## Visual direction

- Night Archive palette: midnight ink, warm ivory, ultraviolet, deep teal, archival amber
- PP Neue Montreal typography
- Interactive hollow-triangle humanoid portrait in the hero
- Scroll-driven research narrative
- Particle globe for publications
- Responsive mobile navigation and static particle fallbacks

## Content

All biography, updates, projects, publications, links, CV, and working paper data live in [`src/data/content.ts`](src/data/content.ts).

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run check
```

## Key directories

```text
src/app/                      App Router entry, metadata, and global tokens
src/components/hero/          Hero and sampled particle portrait
src/components/research/      Updates and scroll-driven project narrative
src/components/publications/  Publication index and particle globe
src/components/about/         About/contact portrait and particle halo
public/images/                Portrait, project images, and robot source
public/documents/             CV and working paper
docs/design-references/       Approved concepts and browser QA captures
docs/research/                Design tokens, topology, component specs, QA
```

## Accessibility and performance

- Semantic landmarks and headings
- Keyboard-visible focus styles
- Accessible mobile menu and abstract disclosures
- `prefers-reduced-motion` support
- Capped canvas density and device-pixel ratio
- Static mobile particle fallback
