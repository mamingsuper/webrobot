"use client";

import { useEffect, useRef } from "react";

import styles from "./hero.module.css";

const SOURCE_PATH = "/images/robot-source.png";
const SOURCE_CROP = { x: 660, y: 66, width: 876, height: 958 } as const;
const PARTICLE_COLORS = ["#7456ff", "#20b8ad", "#d6a13a", "#f2f0e8"] as const;
const MAX_PARTICLES = 4600;
const MOBILE_BREAKPOINT = "(max-width: 760px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

type SourcePoint = {
  x: number;
  y: number;
  colorIndex: number;
  size: number;
};

type Particle = SourcePoint & {
  homeX: number;
  homeY: number;
  velocityX: number;
  velocityY: number;
};

type PointerPosition = {
  x: number;
  y: number;
};

function luminance(red: number, green: number, blue: number) {
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function paletteIndex(red: number, green: number, blue: number, x: number, y: number) {
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const chroma = maximum - minimum;

  if (chroma > 24) {
    if (red > green * 1.24 && green > blue * 0.9) return 2;
    if (green > red * 1.05) return 1;
    return 0;
  }

  const hash = Math.abs((x * 17 + y * 31) % 20);
  if (hash < 3) return 0;
  if (hash < 5) return 1;
  if (hash < 7) return 2;
  return 3;
}

function sampleSource(image: HTMLImageElement): SourcePoint[] {
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.naturalWidth;
  sourceCanvas.height = image.naturalHeight;

  const context = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const { data, width, height } = imageData;
  const integral = new Uint32Array((width + 1) * (height + 1));

  for (let y = 0; y < height; y += 1) {
    let rowTotal = 0;
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = (y * width + x) * 4;
      rowTotal += luminance(data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2]) > 22 ? 1 : 0;
      integral[(y + 1) * (width + 1) + x + 1] = integral[y * (width + 1) + x + 1] + rowTotal;
    }
  }

  const densityAround = (x: number, y: number) => {
    const radius = 6;
    const left = Math.max(0, x - radius);
    const top = Math.max(0, y - radius);
    const right = Math.min(width, x + radius + 1);
    const bottom = Math.min(height, y + radius + 1);
    return (
      integral[bottom * (width + 1) + right] -
      integral[top * (width + 1) + right] -
      integral[bottom * (width + 1) + left] +
      integral[top * (width + 1) + left]
    );
  };

  const sampled: SourcePoint[] = [];
  const step = 10;

  for (let y = SOURCE_CROP.y; y < SOURCE_CROP.y + SOURCE_CROP.height; y += step) {
    for (let x = SOURCE_CROP.x; x < SOURCE_CROP.x + SOURCE_CROP.width; x += step) {
      const jitterX = ((x * 13 + y * 7) % 7) - 3;
      const jitterY = ((x * 5 + y * 11) % 7) - 3;
      const sampleX = Math.min(width - 1, Math.max(0, x + jitterX));
      const sampleY = Math.min(height - 1, Math.max(0, y + jitterY));
      const pixelIndex = (sampleY * width + sampleX) * 4;
      const red = data[pixelIndex];
      const green = data[pixelIndex + 1];
      const blue = data[pixelIndex + 2];

      if (luminance(red, green, blue) < 27 || densityAround(sampleX, sampleY) < 30) continue;

      sampled.push({
        x: sampleX - SOURCE_CROP.x,
        y: sampleY - SOURCE_CROP.y,
        colorIndex: paletteIndex(red, green, blue, sampleX, sampleY),
        size: 1.45 + Math.abs((sampleX * 19 + sampleY * 23) % 20) / 10,
      });
    }
  }

  if (sampled.length <= MAX_PARTICLES) return sampled;

  const ratio = sampled.length / MAX_PARTICLES;
  return sampled.filter((_, index) => Math.floor(index / ratio) !== Math.floor((index - 1) / ratio));
}

function drawTriangle(context: CanvasRenderingContext2D, particle: Particle) {
  const halfWidth = particle.size * 0.9;
  const halfHeight = particle.size * 0.78;
  context.moveTo(particle.x, particle.y - particle.size);
  context.lineTo(particle.x - halfWidth, particle.y + halfHeight);
  context.lineTo(particle.x + halfWidth, particle.y + halfHeight);
  context.closePath();
}

export function ParticlePortrait() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotionQuery = window.matchMedia(REDUCED_MOTION);
    const narrowScreenQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const sourceImage = new Image();
    let animationFrame = 0;
    let sourcePoints: SourcePoint[] = [];
    let particles: Particle[] = [];
    let pointer: PointerPosition | null = null;
    let isStatic = reducedMotionQuery.matches || narrowScreenQuery.matches;
    let isDisposed = false;
    let cssWidth = 0;
    let cssHeight = 0;

    const draw = () => {
      context.clearRect(0, 0, cssWidth, cssHeight);
      context.lineWidth = 0.8;
      context.globalAlpha = isStatic ? 0.94 : 0.88;

      PARTICLE_COLORS.forEach((color, colorIndex) => {
        context.beginPath();
        particles.forEach((particle) => {
          if (particle.colorIndex === colorIndex) drawTriangle(context, particle);
        });
        context.strokeStyle = color;
        context.stroke();
      });

      context.globalAlpha = 1;
    };

    const rebuildParticles = () => {
      if (cssWidth === 0 || cssHeight === 0 || sourcePoints.length === 0) return;

      const scale = Math.max(cssWidth / SOURCE_CROP.width, cssHeight / SOURCE_CROP.height);
      const offsetX = (cssWidth - SOURCE_CROP.width * scale) / 2;
      const offsetY = (cssHeight - SOURCE_CROP.height * scale) / 2;
      particles = sourcePoints.map((point) => {
        const homeX = point.x * scale + offsetX;
        const homeY = point.y * scale + offsetY;
        return {
          ...point,
          x: homeX,
          y: homeY,
          homeX,
          homeY,
          size: Math.max(1.2, point.size * Math.min(1.15, scale)),
          velocityX: 0,
          velocityY: 0,
        };
      });
      canvas.dataset.ready = "true";
      canvas.dataset.static = String(isStatic);
      draw();
    };

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      cssWidth = Math.max(1, Math.round(bounds.width));
      cssHeight = Math.max(1, Math.round(bounds.height));
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(cssWidth * pixelRatio);
      canvas.height = Math.round(cssHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      rebuildParticles();
    };

    const animate = () => {
      particles.forEach((particle) => {
        if (pointer) {
          const deltaX = particle.x - pointer.x;
          const deltaY = particle.y - pointer.y;
          const distanceSquared = deltaX * deltaX + deltaY * deltaY;
          const radius = 82;

          if (distanceSquared > 0.1 && distanceSquared < radius * radius) {
            const distance = Math.sqrt(distanceSquared);
            const pressure = (1 - distance / radius) * 1.25;
            particle.velocityX += (deltaX / distance) * pressure;
            particle.velocityY += (deltaY / distance) * pressure;
          }
        }

        particle.velocityX += (particle.homeX - particle.x) * 0.026;
        particle.velocityY += (particle.homeY - particle.y) * 0.026;
        particle.velocityX *= 0.88;
        particle.velocityY *= 0.88;
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
      });

      draw();
      animationFrame = window.requestAnimationFrame(animate);
    };

    const updateMotionPreference = () => {
      isStatic = reducedMotionQuery.matches || narrowScreenQuery.matches;
      canvas.dataset.static = String(isStatic);
      window.cancelAnimationFrame(animationFrame);
      pointer = null;

      particles.forEach((particle) => {
        particle.x = particle.homeX;
        particle.y = particle.homeY;
        particle.velocityX = 0;
        particle.velocityY = 0;
      });

      if (isStatic) {
        draw();
      } else {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (isStatic) return;
      const bounds = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };

    const handlePointerLeave = () => {
      pointer = null;
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    reducedMotionQuery.addEventListener("change", updateMotionPreference);
    narrowScreenQuery.addEventListener("change", updateMotionPreference);

    const handleSourceLoad = () => {
      if (isDisposed) return;
      sourcePoints = sampleSource(sourceImage);
      resizeCanvas();
      if (!isStatic) animationFrame = window.requestAnimationFrame(animate);
    };

    sourceImage.addEventListener("load", handleSourceLoad);
    sourceImage.src = SOURCE_PATH;

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      sourceImage.removeEventListener("load", handleSourceLoad);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      reducedMotionQuery.removeEventListener("change", updateMotionPreference);
      narrowScreenQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  return (
    <div
      className={styles.portrait}
      role="img"
      aria-label="A left-facing humanoid robot with a wide black spatial-computing visor, a human ear, and a high, long ponytail falling down its back"
    >
      <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />
    </div>
  );
}
