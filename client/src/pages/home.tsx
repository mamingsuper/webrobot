import { SplineSceneDemo } from "@/components/demo/spline-demo";
import { Navigation } from "@/components/ui/navigation";

import { GradientBackground } from "@/components/ui/gradient-background";
import { UpdatesSection } from "@/components/sections/UpdatesSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { PublicationsSection } from "@/components/sections/PublicationsSection";
import { useSectionSnap } from "@/hooks/useSectionSnap";
// Removed Hero component import (reverted as per user request)

export default function Home() {
  // 需求：只在第一次向下浏览时帮助对齐，不要后续强制回弹
  // 使用一次性 snap（session 内只触发一次，可通过清空 sessionStorage 复位）
  useSectionSnap(["about", "updates", "projects", "publications"], {
    threshold: 0.25,
    oncePerSession: true,
    timeoutMs: 1000
  });

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <GradientBackground />
      <a href="#main" className="skip-link">Skip to main content</a>
      <Navigation />



      <main id="main" className="relative z-10">
        <header className="min-h-screen flex items-center justify-center pt-24 pb-8 px-0 md:px-4 lg:px-8" id="about" aria-labelledby="about-heading" data-snap>
          <div className="w-full">
            <h1 id="about-heading" className="sr-only">About</h1>
            {/* 顶部可视 3D 模块 */}
            <SplineSceneDemo />
          </div>
        </header>

        <UpdatesSection />
        <ProjectsSection />
        <PublicationsSection />

        {/* Footer */}
        <footer className="py-10 text-center text-sm text-neutral-500 pb-20">
          <p>© {new Date().getFullYear()} Ming Ma. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}

