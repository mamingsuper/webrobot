"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { hero } from "@/data/content";

const links = [
  { href: "#about", label: "About", shortLabel: "About" },
  { href: "#updates", label: "Updates", shortLabel: "Updates" },
  { href: "#projects", label: "Projects", shortLabel: "Projects" },
  { href: "#publications", label: "Publications", shortLabel: "Pubs" },
];

export function Navigation() {
  const [activeSection, setActiveSection] = useState("#about");

  useEffect(() => {
    const handleScroll = () => {
      const sections = links
        .map((link) => document.getElementById(link.href.slice(1)))
        .filter(Boolean) as HTMLElement[];

      const scrollPosition = window.scrollY + window.innerHeight * 0.28;
      const current =
        sections.findLast((section) => scrollPosition >= section.offsetTop) ?? sections[0];

      if (current) {
        setActiveSection(`#${current.id}`);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed left-0 right-0 top-0 z-50 border-b border-[color:var(--line)] bg-[rgba(255,255,255,0.88)] backdrop-blur-md">
      <nav className="relative mx-auto flex h-[72px] max-w-[1180px] items-center justify-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] p-1 shadow-[0_12px_32px_rgba(36,45,44,0.05)]">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "nav-link shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold leading-none text-[color:var(--muted-ink)] transition-colors sm:px-4",
                activeSection === link.href &&
                  "bg-[color:var(--ink)] text-[color:var(--paper)] hover:text-[color:var(--paper)]"
              )}
            >
              <span className="sm:hidden">{link.shortLabel}</span>
              <span className="hidden sm:inline">{link.label}</span>
            </a>
          ))}
        </div>

        <a
          href={hero.cv}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-4 hidden h-10 shrink-0 items-center gap-2 rounded-full border border-[color:var(--line-strong)] bg-[color:var(--paper)] px-4 text-sm font-semibold text-[color:var(--ink)] transition-colors hover:bg-[color:var(--paper-strong)] md:inline-flex lg:right-8"
        >
          <FileText className="h-4 w-4" />
          CV
        </a>
      </nav>
    </div>
  );
}
