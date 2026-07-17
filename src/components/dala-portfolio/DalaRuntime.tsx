"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type DalaWindow = Window & {
  Intercom?: (...args: unknown[]) => void;
  __dalaRuntimeStarted?: boolean;
};

function initializeDalaRuntime() {
  const dalaWindow = window as DalaWindow;

  // The vendored bundle owns document-lifetime listeners, RAF state, and its
  // original canvas. Routes without Dala must use a full document navigation
  // when returning here; restarting after a soft navigation would duplicate
  // listeners and WebGL resources.
  if (dalaWindow.__dalaRuntimeStarted) {
    return;
  }

  const navigationEntry = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming | undefined;
  const domReadyAlreadyFired =
    document.readyState === "complete" ||
    (navigationEntry?.domContentLoadedEventEnd ?? 0) > 0;

  dalaWindow.__dalaRuntimeStarted = true;

  if (domReadyAlreadyFired) {
    dalaWindow.dispatchEvent(new Event("DOMContentLoaded"));
  }
}

export function DalaRuntime() {
  const [runtimeGuardReady, setRuntimeGuardReady] = useState(false);
  const [manifestReady, setManifestReady] = useState(false);
  const [vendorReady, setVendorReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  useEffect(() => {
    const dalaWindow = window as DalaWindow;
    dalaWindow.Intercom ??= () => undefined;
    setRuntimeGuardReady(true);
  }, []);

  return (
    <>
      {runtimeGuardReady ? (
        <Script
          id="dala-manifest"
          src="/scripts/manifest.js"
          strategy="afterInteractive"
          onLoad={() => setManifestReady(true)}
          onReady={() => setManifestReady(true)}
          onError={() => setRuntimeError("Unable to load the Dala manifest.")}
        />
      ) : null}
      {manifestReady ? (
        <Script
          id="dala-vendor"
          src="/scripts/vendor.js"
          strategy="afterInteractive"
          onLoad={() => setVendorReady(true)}
          onReady={() => setVendorReady(true)}
          onError={() => setRuntimeError("Unable to load the Dala vendor runtime.")}
        />
      ) : null}
      {vendorReady ? (
        <Script
          id="dala-theme"
          src="/scripts/theme.js?v=native-robot-v4"
          strategy="afterInteractive"
          onLoad={initializeDalaRuntime}
          onReady={initializeDalaRuntime}
          onError={() => setRuntimeError("Unable to initialize the Dala experience.")}
        />
      ) : null}
      {runtimeError ? (
        <p role="status" className="sr">
          {runtimeError}
        </p>
      ) : null}
    </>
  );
}
