import Image from "next/image";
import { ArrowUpRight, FileText, Mail } from "lucide-react";
import { hero } from "@/data/content";
import { Reveal } from "@/components/shared/Reveal";
import { ParticleHalo } from "./ParticleHalo";
import styles from "./AboutSection.module.css";

export function AboutSection() {
  return (
    <section className={styles.section} id="contact" aria-labelledby="about-ming">
      <div className={`shell ${styles.grid}`}>
        <div className={styles.titleWrap} aria-hidden="true">
          <span>About</span>
          <span>Ming.</span>
        </div>

        <Reveal className={styles.portraitWrap}>
          <ParticleHalo className={styles.halo} />
          <div className={styles.portraitFrame}>
            <Image
              src={hero.avatar}
              alt="Portrait of Ming Ma"
              fill
              sizes="(max-width: 760px) 78vw, 31vw"
              className={styles.portrait}
            />
          </div>
        </Reveal>

        <Reveal className={styles.copy}>
          <p className="section-kicker">Postdoctoral researcher</p>
          <h2 id="about-ming">Ming Ma</h2>
          <p className={styles.affiliation}>{hero.affiliation}</p>
          <p className={styles.bio}>{hero.bio[1]}</p>
          <p className={styles.bio}>{hero.bio[2]}</p>

          <div className={styles.taxonomy}>
            <div>
              <p className={styles.taxonomyLabel}>Research themes</p>
              <ul>
                {hero.researchThemes.map((theme) => (
                  <li key={theme}>{theme}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className={styles.taxonomyLabel}>Methods</p>
              <ul>
                {hero.methods.map((method) => (
                  <li key={method}>{method}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.actions}>
            <a
              className="pill-button pill-button--primary"
              href={hero.cv}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={16} aria-hidden="true" />
              Download CV
            </a>
            <a className="pill-button pill-button--outline" href={`mailto:${hero.email}`}>
              <Mail size={16} aria-hidden="true" />
              Email
            </a>
            <a
              className={styles.socialLink}
              href={hero.socials[0].link}
              target="_blank"
              rel="noreferrer"
            >
              Follow on X <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
