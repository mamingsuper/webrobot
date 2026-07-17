"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { projects } from "@/data/content";

import { DecisionParticleCanvas } from "./DecisionParticleCanvas";
import styles from "./ResearchSection.module.css";

export function ResearchSection() {
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const chapters = chapterRefs.current.filter((chapter): chapter is HTMLElement => chapter !== null);

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const visibility = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => visibility.set(entry.target, entry.intersectionRatio));

        const mostVisible = chapters.reduce(
          (best, chapter, index) => {
            const ratio = visibility.get(chapter) ?? 0;
            return ratio > best.ratio ? { index, ratio } : best;
          },
          { index: 0, ratio: 0 },
        );

        if (mostVisible.ratio > 0) {
          setActiveIndex(mostVisible.index);
        }
      },
      {
        rootMargin: "-20% 0px -35%",
        threshold: [0.1, 0.25, 0.45, 0.65],
      },
    );

    chapters.forEach((chapter) => observer.observe(chapter));

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} id="research" aria-labelledby="research-heading">
      <div className={styles.headingShell}>
        <p className={styles.kicker}>Research programme</p>
        <h2 className={styles.heading} id="research-heading">
          Humans, systems, decisions.
        </h2>
      </div>

      <div className={styles.story}>
        <div className={styles.visualColumn} aria-hidden="true">
          <div className={styles.visualSticky}>
            <DecisionParticleCanvas activeIndex={activeIndex} />
            <div className={styles.visualCaption}>
              <span>Human encounter</span>
              <span>Decision system</span>
              <span>Artificial mediation</span>
            </div>
            <p className={styles.counter}>
              <span>{String(activeIndex + 1).padStart(2, "0")}</span>
              <span aria-hidden="true">/</span>
              <span>{String(projects.length).padStart(2, "0")}</span>
            </p>
          </div>
        </div>

        <ol className={styles.chapters}>
          {projects.map((project, index) => (
            <li className={styles.chapterItem} key={project.title}>
              <article
                className={styles.chapter}
                data-active={activeIndex === index}
                ref={(node) => {
                  chapterRefs.current[index] = node;
                }}
              >
                <div className={styles.mobileImage}>
                  <Image
                    src={project.img}
                    alt={project.stickerAlt ?? ""}
                    fill
                    sizes="(max-width: 860px) calc(100vw - 40px), 1px"
                  />
                </div>

                <div className={styles.chapterMeta}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>Research project</span>
                </div>
                <p className={styles.focus}>{project.focus}</p>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <p className={styles.description}>{project.desc}</p>
                <ul className={styles.methods} aria-label={`Methods for ${project.title}`}>
                  {project.methods.map((method) => (
                    <li key={method}>{method}</li>
                  ))}
                </ul>
                {project.link ? (
                  <a
                    className={styles.projectLink}
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore project
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
