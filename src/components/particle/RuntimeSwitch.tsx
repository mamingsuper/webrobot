"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import { ParticleExperience } from "./ParticleExperience";

const LegacyDalaExperience = dynamic(
  async () => {
    const [{ ParticleCanvas }, { DalaRuntime }] = await Promise.all([
      import("@/components/dala-portfolio/ParticleCanvas"),
      import("@/components/dala-portfolio/DalaRuntime"),
    ]);

    return function LegacyDalaRuntime() {
      return (
        <>
          <ParticleCanvas />
          <DalaRuntime />
        </>
      );
    };
  },
  { ssr: false },
);

export function RuntimeSwitch({ useDalaFallback }: { useDalaFallback: boolean }) {
  useEffect(() => {
    document.documentElement.dataset.particleRuntime = useDalaFallback ? "dala" : "independent";
  }, [useDalaFallback]);

  return useDalaFallback ? <LegacyDalaExperience /> : <ParticleExperience />;
}
