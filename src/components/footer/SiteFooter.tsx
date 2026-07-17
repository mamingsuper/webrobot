import { ArrowUpRight, Mail } from "lucide-react";
import { hero } from "@/data/content";
import { LogoMark } from "@/components/shared/LogoMark";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`shell ${styles.inner}`}>
        <LogoMark className={styles.logo} />
        <p className={styles.statement}>
          Ideas move through institutions.
          <br />
          Let&apos;s trace where they lead.
        </p>
        <a className={styles.email} href={`mailto:${hero.email}`}>
          <Mail aria-hidden="true" size={20} />
          {hero.email}
          <ArrowUpRight aria-hidden="true" size={18} />
        </a>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Ming Ma</p>
          <nav aria-label="Footer navigation">
            <a href="#about">About</a>
            <a href="#research">Research</a>
            <a href="#publications">Publications</a>
            <a href={hero.cv} target="_blank" rel="noreferrer">CV</a>
          </nav>
          <a href="#about">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
