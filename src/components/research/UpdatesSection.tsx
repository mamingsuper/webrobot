"use client";

import { useEffect, useRef } from "react";

import { updates } from "@/data/content";

import styles from "./UpdatesSection.module.css";

export function UpdatesSection() {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLElement>("[data-update]");

    if (!items?.length) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.setAttribute("data-visible", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12%", threshold: 0.16 },
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} id="updates" aria-labelledby="updates-heading">
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.kicker}>Selected news</p>
          <h2 className={styles.title} id="updates-heading">
            Recent updates.
          </h2>
        </header>

        <ul className={styles.timeline} ref={listRef}>
          {updates.map((update) => (
            <li
              className={styles.item}
              data-category={update.category.toLowerCase()}
              data-update
              data-visible="false"
              key={`${update.date}-${update.title}`}
            >
              <div className={styles.meta}>
                <time className={styles.date}>{update.date}</time>
                <span className={styles.category}>{update.category}</span>
              </div>
              <div className={styles.copy}>
                <h3 className={styles.itemTitle}>{update.title}</h3>
                <p className={styles.content}>{update.content}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
