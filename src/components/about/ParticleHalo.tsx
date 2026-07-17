"use client";

import { useEffect, useRef } from "react";

const colors = ["#7456ff", "#169c92", "#d6a13a", "#f2f0e8"];

type ParticleHaloProps = {
  className?: string;
};

export function ParticleHalo({ className }: ParticleHaloProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0;
    let height = 0;
    let pointerX = 0;
    let pointerY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawTriangle = (x: number, y: number, size: number, color: string) => {
      context.beginPath();
      context.moveTo(x, y - size);
      context.lineTo(x + size * 0.86, y + size * 0.5);
      context.lineTo(x - size * 0.86, y + size * 0.5);
      context.closePath();
      context.strokeStyle = color;
      context.lineWidth = 0.9;
      context.stroke();
    };

    const render = (time = 0) => {
      context.clearRect(0, 0, width, height);
      const centerX = width * 0.5 + pointerX * 8;
      const centerY = height * 0.49 + pointerY * 8;
      const count = width < 500 ? 88 : 148;

      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2;
        const band = index % 3;
        const radius = Math.min(width, height) * (0.34 + band * 0.045);
        const breath = reduceMotion ? 0 : Math.sin(time * 0.00055 + index) * 5;
        const x = centerX + Math.cos(angle) * (radius + breath);
        const y = centerY + Math.sin(angle) * (radius + breath) * 1.05;
        drawTriangle(x, y, 2.2 + (index % 5) * 0.45, colors[index % colors.length]);
      }

      if (!reduceMotion) frame = window.requestAnimationFrame(render);
    };

    const handlePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    };

    resize();
    render();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", handlePointer);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", handlePointer);
    };
  }, []);

  return <canvas aria-hidden="true" className={className} ref={canvasRef} />;
}
