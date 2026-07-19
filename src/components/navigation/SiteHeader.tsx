"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/shared/LogoMark";
import styles from "./SiteHeader.module.css";

const navItems = [
  { label: "About", href: "#about", section: "about" },
  { label: "Research", href: "#research", section: "research" },
  { label: "Publications", href: "#publications", section: "publications" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("about");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 48);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.section))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-25% 0px -55%", threshold: [0.05, 0.2, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.dataset.menuOpen = String(open);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      delete document.body.dataset.menuOpen;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={`shell ${styles.inner}`}>
        <a className={styles.brand} href="#about" aria-label="Ming Ma, home">
          <LogoMark className={styles.logo} />
          <span className={styles.brandText}>Ming Ma</span>
        </a>

        <nav className={styles.desktopNav} aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.section}
              className={styles.navLink}
              data-active={active === item.section}
              href={item.href}
            >
              {item.label}
            </a>
          ))}
          <a
            className={styles.navLink}
            href="/documents/ming-ma-cv.pdf"
            target="_blank"
            rel="noreferrer"
          >
            CV
          </a>
          <a className={styles.namePill} href="#contact">
            Ming Ma
          </a>
        </nav>

        <button
          className={styles.menuButton}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div
        className={styles.mobileMenu}
        data-open={open}
        id="mobile-navigation"
      >
        <nav className={styles.mobileNav} aria-label="Mobile navigation">
          {navItems.map((item, index) => (
            <a key={item.section} href={item.href} onClick={closeMenu}>
              <span>0{index + 1}</span>
              {item.label}
            </a>
          ))}
          <a
            href="/documents/ming-ma-cv.pdf"
            target="_blank"
            rel="noreferrer"
            onClick={closeMenu}
          >
            <span>04</span>
            Curriculum vitae
          </a>
        </nav>
        <a className={styles.mobileEmail} href="mailto:m.ma@ipw.uni-hannover.de">
          m.ma@ipw.uni-hannover.de
        </a>
      </div>
    </header>
  );
}
