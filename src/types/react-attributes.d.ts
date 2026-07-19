import "react";

declare module "react" {
  // The generic matches React's declaration and is required for module merging.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    "anchor-link"?: string;
    "anchor-target"?: string;
    "animate-from"?: string;
    "asscroll-container"?: boolean | "";
    dom2webgl?: string;
    "material-color"?: string;
    "parallax-speed"?: string | number;
    "section-name"?: string;
    "slide-id"?: string;
    "start-x"?: string | number;
  }
}

export {};
