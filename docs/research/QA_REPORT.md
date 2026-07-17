# Visual QA Report

## Native particle verification

- Generated a 200×200 FLOAT RGB EXR with ZIP16 compression.
- Replaced exactly the first 100×100 position-atlas quadrant with 10,000 deterministic robot targets.
- Verified all three remaining Dala target quadrants are numerically identical to the original (`max absolute difference: 0.0`).
- Robot target ranges are X `0.1136–0.8801`, Y `0.0396–0.9602`, and Z `0.0200–0.9800`.
- Robot particles contain real depth derived from distance to the silhouette boundary rather than image luminance alone.
- The point order is shuffled so the first 7,000 mobile instances cover the complete robot.
- Runtime loads `/images/pos-ming-robot-v1.exr`; no Canvas2D overlay or opacity crossfade remains.
- Mobile's missing `py-monbile.glb` request is redirected to the existing native `py-lod7.glb` glyph.

## Layout corrections

- Restored a wide Dala-scale landing headline and reduced duplicate hero biography copy.
- Restored the original mobile landing cadence and readability blur.
- Shortened project display labels and summaries, hid overflow, and restored the original active-link animation hook.
- Shortened investor labels, moved the full publication archive outside the investors grid, and removed the artificial 34rem spacer.
- Full project, publication, CV, email, DOI, and social content remains reachable.

## Validation status

- Position-atlas structure and unchanged targets verified by decoded float comparison.
- Runtime patch signatures and asset paths verified locally.
- ESLint and strict TypeScript pass.
- Next.js production build completes successfully and statically prerenders `/`.
- The generated EXR is served with HTTP `200` at 468,999 bytes, and the production runtime contains the new position-atlas URL with no missing mobile-model URL.
- The browser environment blocked the final localhost reload after the new EXR was generated; no alternate browser surface was used.
