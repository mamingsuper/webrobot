"use client";

import { useEffect, useRef } from "react";

import styles from "./DecisionParticleCanvas.module.css";

type DecisionParticleCanvasProps = {
  activeIndex: number;
};

type Point = {
  x: number;
  y: number;
  size: number;
  phase: number;
  group: "human" | "decision" | "ai" | "ambient";
};

type Palette = {
  human: string;
  decision: string;
  ai: string;
  ambient: string;
  line: string;
};

const palettes: Palette[] = [
  {
    human: "#d6a13a",
    decision: "#d6a13a",
    ai: "#169c92",
    ambient: "#7456ff",
    line: "rgba(242, 240, 232, 0.12)",
  },
  {
    human: "#f2f0e8",
    decision: "#7456ff",
    ai: "#d6a13a",
    ambient: "#169c92",
    line: "rgba(116, 86, 255, 0.17)",
  },
  {
    human: "#169c92",
    decision: "#f2f0e8",
    ai: "#7456ff",
    ambient: "#d6a13a",
    line: "rgba(22, 156, 146, 0.16)",
  },
];

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function addEllipse(
  points: Point[],
  group: Point["group"],
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  count: number,
  seedOffset: number,
) {
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const layer = 0.68 + seededNoise(index + seedOffset) * 0.32;
    points.push({
      x: centerX + Math.cos(angle) * radiusX * layer,
      y: centerY + Math.sin(angle) * radiusY * layer,
      size: 2.1 + seededNoise(index + seedOffset + 17) * 3.4,
      phase: seededNoise(index + seedOffset + 31) * Math.PI * 2,
      group,
    });
  }
}

function addLine(
  points: Point[],
  group: Point["group"],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  count: number,
  seedOffset: number,
) {
  for (let index = 0; index < count; index += 1) {
    const progress = index / Math.max(count - 1, 1);
    points.push({
      x: startX + (endX - startX) * progress,
      y: startY + (endY - startY) * progress,
      size: 1.9 + seededNoise(index + seedOffset) * 2.8,
      phase: seededNoise(index + seedOffset + 23) * Math.PI * 2,
      group,
    });
  }
}

function createScene(): Point[] {
  const points: Point[] = [];

  // Human profile, facing the center.
  addEllipse(points, "human", 0.21, 0.35, 0.17, 0.23, 168, 10);
  addLine(points, "human", 0.17, 0.55, 0.13, 0.86, 46, 210);
  addLine(points, "human", 0.27, 0.54, 0.36, 0.87, 50, 270);
  addLine(points, "human", 0.3, 0.3, 0.38, 0.35, 18, 320);
  addLine(points, "human", 0.38, 0.35, 0.31, 0.39, 12, 350);
  addLine(points, "human", 0.31, 0.43, 0.37, 0.45, 13, 390);

  // AI profile, facing the center, with a restrained mechanical ring.
  addEllipse(points, "ai", 0.78, 0.35, 0.17, 0.23, 168, 430);
  addLine(points, "ai", 0.83, 0.55, 0.88, 0.86, 46, 620);
  addLine(points, "ai", 0.72, 0.54, 0.63, 0.87, 50, 680);
  addLine(points, "ai", 0.7, 0.3, 0.62, 0.35, 18, 740);
  addLine(points, "ai", 0.62, 0.35, 0.69, 0.39, 12, 780);
  addLine(points, "ai", 0.69, 0.43, 0.63, 0.45, 13, 810);
  addEllipse(points, "ai", 0.82, 0.36, 0.055, 0.073, 38, 850);

  // Shared decision node and the institutional paths beneath it.
  addEllipse(points, "decision", 0.5, 0.4, 0.09, 0.12, 74, 900);
  addEllipse(points, "decision", 0.5, 0.4, 0.13, 0.17, 38, 990);
  addLine(points, "decision", 0.5, 0.52, 0.5, 0.77, 30, 1040);
  addLine(points, "decision", 0.5, 0.62, 0.28, 0.74, 30, 1090);
  addLine(points, "decision", 0.5, 0.62, 0.72, 0.74, 30, 1140);

  for (let index = 0; index < 92; index += 1) {
    points.push({
      x: 0.04 + seededNoise(index + 1200) * 0.92,
      y: 0.06 + seededNoise(index + 1400) * 0.87,
      size: 1.7 + seededNoise(index + 1600) * 4.6,
      phase: seededNoise(index + 1800) * Math.PI * 2,
      group: "ambient",
    });
  }

  return points;
}

const scene = createScene();

export function DecisionParticleCanvas({ activeIndex }: DecisionParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const palette = palettes[activeIndex] ?? palettes[0];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(bounds.width, 1);
      height = Math.max(bounds.height, 1);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
    };

    const drawTriangle = (point: Point, elapsed: number) => {
      const drift = reducedMotion ? 0 : Math.sin(elapsed * 0.00045 + point.phase) * 2.2;
      const x = point.x * width + drift;
      const y = point.y * height + drift * 0.45;
      const color = palette[point.group];

      context.beginPath();
      context.moveTo(x, y - point.size);
      context.lineTo(x + point.size * 0.86, y + point.size * 0.55);
      context.lineTo(x - point.size * 0.86, y + point.size * 0.55);
      context.closePath();
      context.strokeStyle = color;
      context.globalAlpha = point.group === "ambient" ? 0.38 : 0.78;
      context.lineWidth = point.group === "decision" ? 1.05 : 0.78;
      context.stroke();
    };

    const draw = (elapsed: number) => {
      context.clearRect(0, 0, width, height);
      context.globalAlpha = 1;

      context.beginPath();
      context.moveTo(width * 0.37, height * 0.4);
      context.lineTo(width * 0.41, height * 0.4);
      context.moveTo(width * 0.59, height * 0.4);
      context.lineTo(width * 0.63, height * 0.4);
      context.moveTo(width * 0.5, height * 0.52);
      context.lineTo(width * 0.5, height * 0.77);
      context.strokeStyle = palette.line;
      context.lineWidth = 1;
      context.stroke();

      scene.forEach((point) => drawTriangle(point, elapsed));
      context.globalAlpha = 1;

      if (!reducedMotion) {
        frame = window.requestAnimationFrame(draw);
      }
    };

    resize();
    draw(0);

    const resizeObserver = new ResizeObserver(() => {
      resize();

      if (reducedMotion) {
        draw(0);
      }
    });
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [activeIndex]);

  return <canvas className={styles.canvas} ref={canvasRef} aria-hidden="true" />;
}
