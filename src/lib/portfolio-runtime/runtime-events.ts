export const runtimeEventNames = {
  progress: "portfolio:runtime-progress",
  ready: "portfolio:runtime-ready",
  error: "portfolio:runtime-error",
} as const;

export type RuntimeProgressDetail = {
  progress: number;
};

export type RuntimeErrorDetail = {
  error: Error;
};

declare global {
  interface WindowEventMap {
    "portfolio:runtime-progress": CustomEvent<RuntimeProgressDetail>;
    "portfolio:runtime-ready": CustomEvent<void>;
    "portfolio:runtime-error": CustomEvent<RuntimeErrorDetail>;
  }
}

export function dispatchRuntimeProgress(progress: number) {
  window.dispatchEvent(
    new CustomEvent<RuntimeProgressDetail>(runtimeEventNames.progress, {
      detail: { progress: Math.min(1, Math.max(0, progress)) },
    }),
  );
}

export function dispatchRuntimeReady() {
  window.dispatchEvent(new CustomEvent<void>(runtimeEventNames.ready));
}

export function dispatchRuntimeError(error: Error) {
  window.dispatchEvent(
    new CustomEvent<RuntimeErrorDetail>(runtimeEventNames.error, {
      detail: { error },
    }),
  );
}
