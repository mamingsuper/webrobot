"use client";

import { useEffect, useState } from "react";

import { runtimeEventNames } from "@/lib/portfolio-runtime/runtime-events";

type SpinnerProps = {
  className: string;
};

function FourSquareSpinner({ className }: SpinnerProps) {
  return (
    <svg
      className={className}
      width="142"
      height="141"
      viewBox="0 0 142 141"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="63.6035" width="14.7917" height="14.7917" fill="white" />
      <rect
        x="63.6035"
        y="125.729"
        width="14.7917"
        height="14.7917"
        fill="white"
      />
      <rect
        x="142"
        y="62.125"
        width="14.7917"
        height="14.7917"
        transform="rotate(90 142 62.125)"
        fill="white"
      />
      <rect
        x="16.2715"
        y="62.125"
        width="14.7917"
        height="16.2708"
        transform="rotate(90 16.2715 62.125)"
        fill="white"
      />
    </svg>
  );
}

type LoaderState = "loading" | "ready" | "hidden" | "error";

export function SiteLoader({ legacyFallback = false }: { legacyFallback?: boolean }) {
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<LoaderState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (legacyFallback) {
      return;
    }

    let hideTimer = 0;
    const handleProgress = (event: WindowEventMap["portfolio:runtime-progress"]) => {
      setProgress(Math.round(event.detail.progress * 100));
    };
    const handleReady = () => {
      setProgress(100);
      setState("ready");
      hideTimer = window.setTimeout(() => setState("hidden"), 520);
    };
    const handleError = (event: WindowEventMap["portfolio:runtime-error"]) => {
      setErrorMessage(event.detail.error.message);
      setState("error");
    };

    window.addEventListener(runtimeEventNames.progress, handleProgress);
    window.addEventListener(runtimeEventNames.ready, handleReady);
    window.addEventListener(runtimeEventNames.error, handleError);
    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener(runtimeEventNames.progress, handleProgress);
      window.removeEventListener(runtimeEventNames.ready, handleReady);
      window.removeEventListener(runtimeEventNames.error, handleError);
    };
  }, [legacyFallback]);

  const digits = String(Math.min(100, Math.max(0, progress))).padStart(3, "0").split("");

  return (
    <>
      <div
        className="site-loader | js-site-loader"
        data-state={legacyFallback ? "legacy" : state}
        aria-hidden={!legacyFallback && state !== "loading"}
      >
        <div className="site-loader__background" />
        <div className="site-loader__content">
          <div className="site-loader__main">
            <div className="site-loader__spinner | js-site-loader-spinner">
              <FourSquareSpinner className="site-loader__spinner-svg | js-site-loader-spinner-svg" />
            </div>

            <div className="site-loader__heading | js-site-loader-heading">
              <div className="site-loader__heading-text">
                <div className="site-loader__heading-inner | js-site-loader-heading-text">
                  The most brilliant super intelligence is human minds.
                </div>
              </div>
            </div>
          </div>

          <div className="site-loader__info d-flex justify-between items-end">
            <div className="site-loader__loading">
              <div className="d-flex overflow-hidden">
                <div className="site-loader__loading-text | js-site-loader-loading-text">
                  LOADING
                </div>
              </div>
              <span className="site-loader__ellipsis | js-site-loader-ellipses">
                <span className="site-loader__ellipsis-wrapper | js-site-loader-ellipses-wrapper">
                  <span>.</span> <span>.</span> <span>.</span>
                </span>
              </span>
            </div>
            <div className="site-loader__completed | js-site-loader-completed-text">
              <span>Completed</span>
            </div>
            <div className="site-loader__progress | js-site-loader-progress">
              <span className="js-site-loader-progress-digit">{digits[0]}</span>{" "}
              <span className="js-site-loader-progress-digit">{digits[1]}</span>{" "}
              <span className="js-site-loader-progress-digit">{digits[2]}</span>
            </div>
          </div>
        </div>
      </div>

      {state === "error" ? (
        <p className="sr runtime-failure" role="status">
          Interactive particles are unavailable. All portfolio content remains accessible. {errorMessage}
        </p>
      ) : null}

      <div className="nav-transition-mask-bg | js-nav-transition-mask-bg" />
      <div className="nav-transition-mask js-nav-transition-mask">
        <div className="nav-transition-mask__spinner | js-nav-transition-mask-spinner">
          <FourSquareSpinner className="nav-transition-mask__spinner-svg | js-nav-transition-mask-spinner-svg" />
        </div>
      </div>
    </>
  );
}
