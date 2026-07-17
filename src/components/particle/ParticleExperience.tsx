"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { ParticleEngine as ParticleEngineInstance } from "@/lib/particle-runtime/ParticleEngine";
import {
  dispatchRuntimeError,
  dispatchRuntimeProgress,
  dispatchRuntimeReady,
} from "@/lib/portfolio-runtime/runtime-events";
import {
  createScrollDirector,
  type ScrollDirector,
} from "@/lib/portfolio-runtime/scroll-director";

const targetUrl = "/particles/portfolio-targets.bin?v=8469cf46";

type DebuggableParticleEngine = ParticleEngineInstance & {
  setDebugTime?: (seconds: number | null) => void;
};

type ParticleDebugSnapshot = {
  stageProgress: number | null;
  timeSeconds: number | null;
  pointer: { x: number; y: number; active: boolean };
};

type ParticleDebugControls = {
  setStageProgress: (progress: number | null) => void;
  setTime: (seconds: number | null) => void;
  setPointer: (x: number, y: number, active?: boolean) => void;
  triggerImpulse: (x: number, y: number) => void;
  reset: () => void;
  snapshot: () => ParticleDebugSnapshot;
};

declare global {
  interface Window {
    __MING_PARTICLE_DEBUG__?: ParticleDebugControls;
  }
}

function subscribeToReducedMotion(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ParticleExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextGeneration, setContextGeneration] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const canvasElement = canvas;

    document.documentElement.dataset.particleRuntime = "independent";
    let disposed = false;
    let contextAvailable = true;
    let engine: DebuggableParticleEngine | null = null;
    let director: ScrollDirector | null = null;
    let debugControls: ParticleDebugControls | null = null;

    const pointerClipPosition = (event: PointerEvent) => ({
      x: (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1,
      y: 1 - (event.clientY / Math.max(1, window.innerHeight)) * 2,
    });
    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion || !contextAvailable || !event.isPrimary) {
        engine?.setPointer(0, 0, false);
        return;
      }
      const pointer = pointerClipPosition(event);
      engine?.setPointer(pointer.x, pointer.y, true);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (
        reducedMotion ||
        !contextAvailable ||
        !event.isPrimary ||
        event.button > 0
      ) {
        return;
      }
      const pointer = pointerClipPosition(event);
      engine?.setPointer(pointer.x, pointer.y, true);
      if (!(event.target as Element)?.closest?.(
        "a,button,input,select,textarea,[role='button']",
      )) {
        engine?.triggerImpulse(pointer.x, pointer.y);
      }
    };
    const handlePointerEnd = (event: PointerEvent) => {
      if (event.isPrimary && event.pointerType !== "mouse") {
        engine?.setPointer(0, 0, false);
      }
    };
    const handlePointerLeave = () => engine?.setPointer(0, 0, false);
    const handleResize = () => engine?.resize();
    const handleVisibility = () => engine?.setPaused(document.hidden);
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextAvailable = false;
      engine?.setPaused(true);
    };
    const handleContextRestored = () => {
      contextAvailable = true;
      setContextGeneration((generation) => generation + 1);
    };

    function installDebugControls() {
      if (process.env.NODE_ENV === "production") {
        return;
      }

      const state: ParticleDebugSnapshot = {
        stageProgress: null,
        timeSeconds: null,
        pointer: { x: 0, y: 0, active: false },
      };
      const normalizePointer = (value: number) =>
        Math.min(Math.max(Number.isFinite(value) ? value : 0, -1), 1);

      debugControls = {
        setStageProgress(progress) {
          state.stageProgress = progress === null
            ? null
            : Math.min(Math.max(Number.isFinite(progress) ? progress : 0, 0), 3);
          director?.setDebugProgress(state.stageProgress);
        },
        setTime(seconds) {
          state.timeSeconds = seconds === null
            ? null
            : Math.max(Number.isFinite(seconds) ? seconds : 0, 0);
          engine?.setDebugTime?.(state.timeSeconds);
        },
        setPointer(x, y, active = true) {
          state.pointer = {
            x: normalizePointer(x),
            y: normalizePointer(y),
            active,
          };
          engine?.setPointer(state.pointer.x, state.pointer.y, state.pointer.active);
        },
        triggerImpulse(x, y) {
          engine?.triggerImpulse(normalizePointer(x), normalizePointer(y));
        },
        reset() {
          state.stageProgress = null;
          state.timeSeconds = null;
          state.pointer = { x: 0, y: 0, active: false };
          director?.setDebugProgress(null);
          engine?.setDebugTime?.(null);
          engine?.setPointer(0, 0, false);
        },
        snapshot() {
          return {
            stageProgress: state.stageProgress,
            timeSeconds: state.timeSeconds,
            pointer: { ...state.pointer },
          };
        },
      };
      window.__MING_PARTICLE_DEBUG__ = debugControls;
      document.documentElement.dataset.particleDebug = "available";

      const query = new URLSearchParams(window.location.search);
      const stage = query.get("particleStage");
      const time = query.get("particleTime");
      const pointer = query.get("particlePointer")?.split(",").map(Number);
      if (stage !== null) {
        debugControls.setStageProgress(Number(stage));
      }
      if (time !== null) {
        debugControls.setTime(Number(time));
      }
      if (pointer?.length === 2) {
        debugControls.setPointer(pointer[0], pointer[1]);
      }
    }

    async function initializeRuntime() {
      const { ParticleEngine } = await import("@/lib/particle-runtime/ParticleEngine");
      if (disposed) {
        return;
      }

      const activeEngine = new ParticleEngine({
        canvas: canvasElement,
        targetUrl,
        reducedMotion,
        onProgress: dispatchRuntimeProgress,
        onReady: dispatchRuntimeReady,
        onError: dispatchRuntimeError,
      });
      engine = activeEngine;
      director = createScrollDirector({
        reducedMotion,
        onProgress: (progress) => activeEngine.setStageProgress(progress),
      });
      installDebugControls();
      void activeEngine.start().catch(() => undefined);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerEnd, { passive: true });
    window.addEventListener("pointercancel", handlePointerEnd, { passive: true });
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    canvasElement.addEventListener("webglcontextlost", handleContextLost);
    canvasElement.addEventListener("webglcontextrestored", handleContextRestored);

    void initializeRuntime().catch((cause: unknown) => {
      if (!disposed) {
        const error = cause instanceof Error ? cause : new Error("Particle runtime failed to start.");
        dispatchRuntimeError(error);
      }
    });

    return () => {
      disposed = true;
      director?.destroy();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      canvasElement.removeEventListener("webglcontextlost", handleContextLost);
      canvasElement.removeEventListener("webglcontextrestored", handleContextRestored);
      engine?.destroy();
      if (window.__MING_PARTICLE_DEBUG__ === debugControls) {
        delete window.__MING_PARTICLE_DEBUG__;
      }
      delete document.documentElement.dataset.particleDebug;
      delete document.documentElement.dataset.particleRuntime;
    };
  }, [contextGeneration, reducedMotion]);

  return <canvas id="canvas" ref={canvasRef} className="particle-experience" aria-hidden="true" />;
}
