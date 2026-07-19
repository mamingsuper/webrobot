export const MPRT_MAGIC = "MPRT";
export const MPRT_VERSION = 2;
export const MPRT_STAGE_COUNT = 4;
export const MPRT_POINTS_PER_STAGE = 10_000;
export const MPRT_COMPONENTS = 12;
export const MPRT_HEADER_BYTES = 20;
export const MPRT_VECTOR_COMPONENTS = 4;

export type ParticleTargetData = {
  version: number;
  stageCount: number;
  pointsPerStage: number;
  components: number;
  data: Float32Array;
  stages: readonly Float32Array[];
  styles: readonly Float32Array[];
  metadata: readonly Float32Array[];
};

function readMagic(view: DataView) {
  return String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );
}

function requireHeaderValue(label: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(
      `Invalid MPRT ${label}: expected ${expected}, received ${actual}.`,
    );
  }
}

export function parseParticleTargets(buffer: ArrayBuffer): ParticleTargetData {
  if (buffer.byteLength < MPRT_HEADER_BYTES) {
    throw new Error(
      `Invalid MPRT binary: expected at least ${MPRT_HEADER_BYTES} header bytes, received ${buffer.byteLength}.`,
    );
  }

  const view = new DataView(buffer);
  const magic = readMagic(view);
  if (magic !== MPRT_MAGIC) {
    throw new Error(
      `Invalid MPRT magic: expected ${MPRT_MAGIC}, received ${JSON.stringify(magic)}.`,
    );
  }

  const version = view.getUint32(4, true);
  const stageCount = view.getUint32(8, true);
  const pointsPerStage = view.getUint32(12, true);
  const components = view.getUint32(16, true);

  requireHeaderValue("version", version, MPRT_VERSION);
  requireHeaderValue("stage count", stageCount, MPRT_STAGE_COUNT);
  requireHeaderValue(
    "points per stage",
    pointsPerStage,
    MPRT_POINTS_PER_STAGE,
  );
  requireHeaderValue("component count", components, MPRT_COMPONENTS);

  const valueCount = stageCount * pointsPerStage * components;
  const expectedLength = MPRT_HEADER_BYTES + valueCount * Float32Array.BYTES_PER_ELEMENT;
  if (buffer.byteLength !== expectedLength) {
    throw new Error(
      `Invalid MPRT byte length: expected ${expectedLength}, received ${buffer.byteLength}.`,
    );
  }

  const data = new Float32Array(valueCount);
  for (let index = 0; index < valueCount; index += 1) {
    const value = view.getFloat32(
      MPRT_HEADER_BYTES + index * Float32Array.BYTES_PER_ELEMENT,
      true,
    );
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid MPRT stage data: component ${index} is not finite.`);
    }
    if (value < 0 || value > 1) {
      throw new Error(
        `Invalid MPRT stage data: component ${index} must be normalized to [0, 1], received ${value}.`,
      );
    }
    data[index] = value;
  }

  const vectorsPerStage = pointsPerStage * MPRT_VECTOR_COMPONENTS;
  const stages = Array.from(
    { length: stageCount },
    () => new Float32Array(vectorsPerStage),
  );
  const styles = Array.from(
    { length: stageCount },
    () => new Float32Array(vectorsPerStage),
  );
  const metadata = Array.from(
    { length: stageCount },
    () => new Float32Array(vectorsPerStage),
  );

  for (let stageIndex = 0; stageIndex < stageCount; stageIndex += 1) {
    const sourceStageOffset = stageIndex * pointsPerStage * components;
    for (let pointIndex = 0; pointIndex < pointsPerStage; pointIndex += 1) {
      const sourceOffset = sourceStageOffset + pointIndex * components;
      const vectorOffset = pointIndex * MPRT_VECTOR_COMPONENTS;
      stages[stageIndex].set(
        data.subarray(sourceOffset, sourceOffset + MPRT_VECTOR_COMPONENTS),
        vectorOffset,
      );
      styles[stageIndex].set(
        data.subarray(
          sourceOffset + MPRT_VECTOR_COMPONENTS,
          sourceOffset + MPRT_VECTOR_COMPONENTS * 2,
        ),
        vectorOffset,
      );
      metadata[stageIndex].set(
        data.subarray(
          sourceOffset + MPRT_VECTOR_COMPONENTS * 2,
          sourceOffset + MPRT_VECTOR_COMPONENTS * 3,
        ),
        vectorOffset,
      );
    }
  }

  return {
    version,
    stageCount,
    pointsPerStage,
    components,
    data,
    stages,
    styles,
    metadata,
  };
}
