import * as THREE from "three";

import type { ParticleTargetData } from "./binary";

export const DALA_MAIN_PARTICLE_COUNT = 10_000;
export const DALA_MOBILE_PARTICLE_COUNT = 7_000;
export const DALA_FOREGROUND_PARTICLE_COUNT = 250;
export const DALA_SIMULATION_SIDE = 100;
export const DALA_ASSEMBLY_SECONDS = 3;
export const DALA_STAGGER_SPREAD = 5;
export const DALA_SPRING_JITTER = 0.0001;
export const IMPULSE_SECONDS = 1.4;

export const DALA_DYNAMICS = Object.freeze({
  spring: 0.006,
  friction: 0.892,
  hoverRadius: 0.78,
  hoverScale: 0.04,
});

export const DALA_POSTPROCESSING = Object.freeze({
  focalDepth: 0.125,
  focalLength: 27,
  fstop: 2509,
  maxblur: 10,
  vignetteOffset: 0.3,
  vignetteDarkness: 4,
});

export const DALA_MAIN_PALETTE = Object.freeze([
  "#c88d00",
  "#5c01bb",
  "#007249",
  "#b1a0b6",
]);

export const DALA_FOREGROUND_PALETTE = Object.freeze([
  "#5d399a",
  "#ba882b",
  "#287464",
  "#a494af",
]);

export type ParticleTargetDataV2Compatible = ParticleTargetData & {
  styles?: readonly Float32Array[];
  metadata?: readonly Float32Array[] | Float32Array;
};

/**
 * Rebuilds the compact Dala tetrahedral glyph in first-party code, so the
 * renderer keeps the reference silhouette without loading the legacy GLB.
 */
export function createDalaGlyphGeometry() {
  const positions = [
    0.000181, 0.677622, 0, -0.000181, 0.827617, 0,
    0.297325, -0.223772, 0.442511, 0.371668, -0.277969, 0.560979,
    0.297325, -0.223772, -0.442511, 0.371668, -0.277969, -0.560979,
    -0.598475, -0.22534, 0, -0.739512, -0.276401, 0,
    0.05534, 0.5866, 0, 0.31078, -0.179719, 0.38316,
    0.31078, -0.179719, -0.38316, -0.024246, 0.600358, -0.038631,
    0.235539, -0.178997, -0.428308, -0.543816, -0.178997, -0.038631,
    -0.024246, 0.600358, 0.038631, -0.543816, -0.178997, 0.038631,
    0.235539, -0.178997, 0.428308, -0.501288, -0.25087, 0,
    0.259497, -0.25087, -0.380392, 0.259497, -0.250871, 0.380392,
  ];
  const indices = [
    8, 9, 2, 8, 2, 0, 9, 8, 1, 9, 1, 3, 9, 10, 4, 9, 4, 2,
    10, 9, 3, 10, 3, 5, 10, 8, 0, 10, 0, 4, 8, 10, 5, 8, 5, 1,
    11, 12, 4, 11, 4, 0, 12, 11, 1, 12, 1, 5, 12, 13, 6, 12, 6, 4,
    13, 12, 5, 13, 5, 7, 13, 11, 0, 13, 0, 6, 11, 13, 7, 11, 7, 1,
    14, 15, 6, 14, 6, 0, 15, 14, 1, 15, 1, 7, 15, 16, 2, 15, 2, 6,
    16, 15, 7, 16, 7, 3, 16, 14, 0, 16, 0, 2, 14, 16, 3, 14, 3, 1,
    17, 18, 4, 17, 4, 6, 18, 17, 7, 18, 7, 5, 18, 19, 2, 18, 2, 4,
    19, 18, 5, 19, 5, 3, 19, 17, 6, 19, 6, 2, 17, 19, 3, 17, 3, 7,
  ];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function quinticEase(value: number) {
  const clamped = Math.min(Math.max(value, 0), 1);
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
}
