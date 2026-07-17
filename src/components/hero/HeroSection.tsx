import Image from "next/image";

import { hero } from "@/data/content";

import { ParticlePortrait } from "./ParticlePortrait";
import styles from "./hero.module.css";

export function HeroSection() {
  return (
    <section className={styles.hero} id="about" aria-labelledby="hero-title">
      <div className={styles.copy}>
        <div className={styles.identity}>
          <div className={styles.avatarFrame}>
            <Image
              className={styles.avatar}
              src={hero.avatar}
              alt={`Portrait of ${hero.name}`}
              width={148}
              height={148}
              priority
            />
          </div>

          <div className={styles.identityText}>
            <h1 id="hero-title" className={styles.name}>
              {hero.name}
            </h1>
            <p className={styles.role}>{hero.role}</p>
            <p className={styles.affiliation}>{hero.affiliation}</p>
            <p className={styles.project} title={hero.project}>
              ERC project <span aria-hidden="true">·</span> {hero.projectShort}
            </p>
          </div>
        </div>

        <div className={styles.biography}>
          {hero.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className={styles.actions} aria-label="Profile actions">
          <a className={`${styles.button} ${styles.primaryButton}`} href="#research">
            View research
          </a>
          <a
            className={`${styles.button} ${styles.secondaryButton}`}
            href={`mailto:${hero.email}`}
            aria-label={`Email ${hero.name}`}
          >
            Email
          </a>
        </div>
      </div>

      <ParticlePortrait />
    </section>
  );
}
