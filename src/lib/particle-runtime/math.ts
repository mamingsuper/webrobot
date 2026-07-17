import { MPRT_STAGE_COUNT } from "./binary";

export type StageInterpolation = {
  progress: number;
  from: number;
  to: number;
  blend: number;
};

export type StagePlacement = {
  x: number;
  y: number;
  scale: number;
};

export type StageMotionImpulse = {
  velocity: number;
  energy: number;
  direction: -1 | 0 | 1;
};

export type DalaStageState = {
  from: number;
  to: number;
  morph: number;
  explode: number;
  settledStage: number;
  sweep: { x: number; y: number; spin: number };
};

export const TRANSITION_CHOREOGRAPHY = [
  { dx: -0.34, dy: 0.04, spin: 0.25 * Math.PI },
  { dx: 0.28, dy: -0.06, spin: -0.33 * Math.PI },
  { dx: 0.1, dy: -0.16, spin: 0.5 * Math.PI },
] as const;

export const STAGE_PLACEMENTS: readonly StagePlacement[] = [
  { x: 0.3, y: 0.01, scale: 1.68 },
  { x: -0.54, y: -0.1, scale: 1.38 },
  { x: -0.55, y: -0.3, scale: 1.2 },
  { x: 0.28, y: 0.0, scale: 1.3 },
];

const PORTRAIT_SCALE_FACTOR = 0.42;

export const PORTRAIT_STAGE_PLACEMENTS: readonly StagePlacement[] = [
  { x: 0.52, y: 0.34, scale: STAGE_PLACEMENTS[0].scale * PORTRAIT_SCALE_FACTOR },
  { x: -0.46, y: 0.22, scale: STAGE_PLACEMENTS[1].scale * PORTRAIT_SCALE_FACTOR },
  { x: -0.42, y: -0.42, scale: STAGE_PLACEMENTS[2].scale * PORTRAIT_SCALE_FACTOR },
  { x: 0, y: -0.18, scale: 0.6 },
];

export function clampStageProgress(
  progress: number,
  stageCount = MPRT_STAGE_COUNT,
) {
  if (stageCount < 1 || !Number.isInteger(stageCount)) {
    throw new Error("Stage count must be a positive integer.");
  }
  if (!Number.isFinite(progress)) return 0;
  return Math.min(Math.max(progress, 0), stageCount - 1);
}

export function resolveStageInterpolation(
  progress: number,
  stageCount = MPRT_STAGE_COUNT,
): StageInterpolation {
  const clamped = clampStageProgress(progress, stageCount);
  const from = Math.floor(clamped);
  const to = Math.min(from + 1, stageCount - 1);
  return {
    progress: clamped,
    from,
    to,
    blend: to === from ? 0 : clamped - from,
  };
}

function clampUnit(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function mapUnitWindow(value: number, start: number, end: number) {
  return clampUnit((value - start) / (end - start));
}

/**
 * Resolves the scroll-driven transition windows used by the Dala reference.
 * Target migration leads the incoming section: it begins while the outgoing
 * section still dominates and settles before the next section reaches its
 * final position. The expansion pulse stays inside that earlier morph window.
 */
export function resolveDalaStageState(
  progress: number,
  stageCount = MPRT_STAGE_COUNT,
): DalaStageState {
  const clamped = clampStageProgress(progress, stageCount);
  const from = Math.floor(clamped);
  const to = Math.min(from + 1, stageCount - 1);

  if (from === to) {
    return {
      from,
      to,
      morph: 0,
      explode: 0,
      settledStage: from,
      sweep: { x: 0, y: 0, spin: 0 },
    };
  }

  const localProgress = clamped - from;
  const explodeRise = mapUnitWindow(localProgress, 0.38, 0.5);
  const explodeFall = mapUnitWindow(localProgress, 0.64, 0.78);
  const sweepRise = mapUnitWindow(localProgress, 0.35, 0.52);
  const sweepFall = mapUnitWindow(localProgress, 0.55, 0.78);
  const amount = quintic(sweepRise) * (1 - quintic(sweepFall));
  const choreography = TRANSITION_CHOREOGRAPHY[from];
  const sweep = amount === 0
    ? { x: 0, y: 0, spin: 0 }
    : {
        x: choreography.dx * amount,
        y: choreography.dy * amount,
        spin: choreography.spin * amount,
      };

  return {
    from,
    to,
    morph: mapUnitWindow(localProgress, 0.35, 0.78),
    explode: clampUnit(explodeRise - explodeFall),
    settledStage: from,
    sweep,
  };
}

function quintic(value: number) {
  const clamped = clampUnit(value);
  return clamped * clamped * clamped
    * (clamped * (clamped * 6 - 15) + 10);
}

function interpolatePlacement(
  progress: number,
  placements: readonly StagePlacement[],
): StagePlacement {
  const interpolation = resolveStageInterpolation(
    progress,
    placements.length,
  );
  const from = placements[interpolation.from];
  const to = placements[interpolation.to];
  const blend = interpolation.blend;
  return {
    x: from.x + (to.x - from.x) * blend,
    y: from.y + (to.y - from.y) * blend,
    scale: from.scale + (to.scale - from.scale) * blend,
  };
}

export function resolveStagePlacement(progress: number): StagePlacement {
  return interpolatePlacement(progress, STAGE_PLACEMENTS);
}

export function resolveViewportStagePlacement(
  progress: number,
  viewportAspect: number,
): StagePlacement {
  const aspect = Number.isFinite(viewportAspect) && viewportAspect > 0
    ? viewportAspect
    : 1;
  const portraitAmount = Math.min(Math.max((1 - aspect) / 0.28, 0), 1);
  const desktop = interpolatePlacement(progress, STAGE_PLACEMENTS);
  if (portraitAmount === 0) return desktop;
  const portrait = interpolatePlacement(progress, PORTRAIT_STAGE_PLACEMENTS);
  return {
    x: desktop.x + (portrait.x - desktop.x) * portraitAmount,
    y: desktop.y + (portrait.y - desktop.y) * portraitAmount,
    scale: desktop.scale + (portrait.scale - desktop.scale) * portraitAmount,
  };
}

export function resolveStageMotionImpulse(
  previousProgress: number,
  nextProgress: number,
  deltaSeconds: number,
): StageMotionImpulse {
  const previous = clampStageProgress(previousProgress);
  const next = clampStageProgress(nextProgress);
  const safeDelta = Number.isFinite(deltaSeconds)
    ? Math.min(Math.max(deltaSeconds, 1 / 120), 0.25)
    : 1 / 60;
  const velocity = (next - previous) / safeDelta;
  return {
    velocity,
    energy: Math.min(Math.abs(velocity) * 0.08, 1.25),
    direction: velocity === 0 ? 0 : velocity > 0 ? 1 : -1,
  };
}

export function damp(
  current: number,
  target: number,
  smoothing: number,
  deltaSeconds: number,
) {
  return target + (current - target) * Math.exp(-smoothing * deltaSeconds);
}
