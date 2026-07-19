"use client";

import { useEffect, useId, useMemo, useState } from "react";

import styles from "./PublicationsSection.module.css";

type Point = {
  opacity: number;
  size: number;
  x: number;
  y: number;
};

type Rotation = {
  x: number;
  y: number;
};

const VIEWBOX_SIZE = 640;
const GLOBE_CENTER = VIEWBOX_SIZE / 2;
const GLOBE_RADIUS = 216;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function createSpherePoints(count: number): Point[] {
  const stableNumber = (value: number) => Number(value.toFixed(6));

  return Array.from({ length: count }, (_, index) => {
    const normalizedY = 1 - (index / (count - 1)) * 2;
    const latitudeRadius = Math.sqrt(1 - normalizedY * normalizedY);
    const theta = GOLDEN_ANGLE * index;
    const sphereX = Math.cos(theta) * latitudeRadius;
    const sphereZ = Math.sin(theta) * latitudeRadius;

    return {
      opacity: stableNumber(0.32 + ((sphereZ + 1) / 2) * 0.68),
      size: stableNumber(2.5 + ((sphereZ + 1) / 2) * 3.4),
      x: stableNumber(GLOBE_CENTER + sphereX * GLOBE_RADIUS),
      y: stableNumber(GLOBE_CENTER + normalizedY * GLOBE_RADIUS),
    };
  });
}

function trianglePoints(point: Point): string {
  const halfSize = point.size / 2;
  return `${point.x},${point.y - point.size} ${point.x - halfSize},${point.y + halfSize} ${point.x + halfSize},${point.y + halfSize}`;
}

export function ParticleGlobe() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [rotation, setRotation] = useState<Rotation>({ x: 0, y: 0 });
  const rawId = useId();
  const gradientId = `particle-globe-${rawId.replaceAll(":", "")}`;
  const points = useMemo(() => createSpherePoints(210), []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(motionQuery.matches);

    updatePreference();
    motionQuery.addEventListener("change", updatePreference);

    return () => motionQuery.removeEventListener("change", updatePreference);
  }, []);

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (prefersReducedMotion) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;

    setRotation({
      x: relativeY * -8,
      y: relativeX * 10,
    });
  }

  function resetRotation() {
    setRotation({ x: 0, y: 0 });
  }

  const transform = `translate(${rotation.y} ${rotation.x}) rotate(${rotation.y / 4} ${GLOBE_CENTER} ${GLOBE_CENTER})`;

  return (
    <div className={styles.globeFrame}>
      <svg
        aria-labelledby={`${gradientId}-title ${gradientId}-description`}
        className={styles.globe}
        onPointerLeave={resetRotation}
        onPointerMove={handlePointerMove}
        role="img"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      >
        <title id={`${gradientId}-title`}>A particle globe of circulating ideas</title>
        <desc id={`${gradientId}-description`}>
          Triangular particles, transmission arcs, and expanding signals form a global narrative network.
        </desc>

        <defs>
          <radialGradient cx="38%" cy="32%" id={gradientId} r="70%">
            <stop offset="0%" stopColor="#7456ff" stopOpacity="0.22" />
            <stop offset="68%" stopColor="#0d1220" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#080a12" stopOpacity="0.04" />
          </radialGradient>
          <clipPath id={`${gradientId}-clip`}>
            <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} />
          </clipPath>
        </defs>

        <g className={styles.globeStage} transform={transform}>
          <circle
            className={styles.globeAtmosphere}
            cx={GLOBE_CENTER}
            cy={GLOBE_CENTER}
            fill={`url(#${gradientId})`}
            r={GLOBE_RADIUS + 34}
          />
          <circle
            className={styles.globeOutline}
            cx={GLOBE_CENTER}
            cy={GLOBE_CENTER}
            r={GLOBE_RADIUS}
          />

          <g clipPath={`url(#${gradientId}-clip)`}>
            <ellipse className={styles.globeLatitude} cx="320" cy="320" rx="216" ry="67" />
            <ellipse className={styles.globeLatitude} cx="320" cy="320" rx="216" ry="132" />
            <ellipse className={styles.globeLongitude} cx="320" cy="320" rx="76" ry="216" />
            <ellipse className={styles.globeLongitude} cx="320" cy="320" rx="142" ry="216" />

            <g className={styles.spherePoints}>
              {points.map((point, index) => (
                <polygon
                  fillOpacity={point.opacity}
                  key={`${point.x}-${point.y}-${index}`}
                  points={trianglePoints(point)}
                />
              ))}
            </g>
          </g>

          <g className={styles.transmissionArcs}>
            <path d="M171 410 Q305 74 483 238" />
            <path d="M143 270 Q350 166 498 388" />
            <path d="M240 505 Q360 210 480 166" />
          </g>

          <g className={styles.signal}>
            <circle cx="483" cy="238" r="8" />
            <circle cx="483" cy="238" r="24" />
            <circle cx="483" cy="238" r="44" />
          </g>
          <g className={`${styles.signal} ${styles.signalTwo}`}>
            <circle cx="171" cy="410" r="8" />
            <circle cx="171" cy="410" r="24" />
            <circle cx="171" cy="410" r="44" />
          </g>
          <g className={`${styles.signal} ${styles.signalThree}`}>
            <circle cx="240" cy="505" r="8" />
            <circle cx="240" cy="505" r="24" />
            <circle cx="240" cy="505" r="44" />
          </g>
        </g>

        <path className={styles.outerOrbit} d="M66 398 C128 108 510 52 584 318 C648 548 226 644 72 438" />
        <circle className={styles.orbitNode} cx="585" cy="318" r="5" />
      </svg>

      <p aria-hidden="true" className={styles.globeCaption}>
        <span>Global narrative network</span>
        <span>210 active signals</span>
      </p>
    </div>
  );
}
