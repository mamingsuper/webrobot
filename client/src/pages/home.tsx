import { Hero } from "@/components/hero";
import { Navigation } from "@/components/ui/navigation";
import { GradientBackground } from "@/components/ui/gradient-background";
import { UpdatesSection } from "@/components/sections/UpdatesSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { PublicationsSection } from "@/components/sections/PublicationsSection";
import { useSectionSnap } from "@/hooks/useSectionSnap";

export default function Home() {
  useSectionSnap(["about", "updates", "projects", "publications"], {
    threshold: 0.25,
    oncePerSession: true,
    timeoutMs: 1000
  });

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <GradientBackground />
      <a href="#main" className="skip-link">Skip to main content</a>
      <Navigation />

      <main id="main" className="relative z-10">
        <Hero />
        <UpdatesSection />
        <ProjectsSection />
        <PublicationsSection />

        <footer className="mx-auto max-w-[1180px] px-4 pb-14 pt-8 text-sm text-[color:var(--muted-ink)] sm:px-6 lg:px-8">
          <div className="border-t border-[color:var(--line)] pt-8">
          <p>© {new Date().getFullYear()} Ming Ma. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
