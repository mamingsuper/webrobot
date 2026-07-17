"use client";

import { useState } from "react";

import type { ArchivePublication, PublicationKind } from "@/lib/publications";

const filters: Array<"All" | PublicationKind> = ["All", "Article", "Working paper", "Book chapter"];

export function publicationAbstract(abstract?: string) {
  return abstract?.trim() || undefined;
}

export function PublicationArchive({ items }: { items: ArchivePublication[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const visible = filter === "All" ? items : items.filter((item) => item.kind === filter);
  const years = [...new Set(visible.map((item) => item.year))];

  return (
    <>
      <div className="archive-filters" aria-label="Filter publications">
        {filters.map((option) => (
          <button
            type="button"
            key={option}
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <p className="archive-status" role="status">
        Showing {visible.length} publications
      </p>

      <div className="archive-years">
        {years.map((year) => (
          <section className="archive-year" key={year} aria-labelledby={`year-${year}`}>
            <h2 id={`year-${year}`}>{year}</h2>
            <ol>
              {visible.filter((item) => item.year === year).map((item) => {
                const abstract = publicationAbstract(item.abstract);

                return (
                  <li id={item.id} key={item.id} className="archive-entry">
                    <div className="archive-entry-meta">
                      <span>{item.kind}</span>
                      <span>{item.venue}{item.detail && item.detail !== item.venue ? ` · ${item.detail}` : ""}</span>
                    </div>
                    <h3><a href={`#${item.id}`}>{item.title}</a></h3>
                    <p className="archive-authors">{item.authors}</p>
                    {abstract ? (
                      <details className="archive-abstract">
                        <summary>Abstract</summary>
                        <p>{abstract}</p>
                      </details>
                    ) : null}
                    <div className="archive-entry-actions">
                      {item.href ? <a href={item.href} target="_blank" rel="noreferrer">Open publication ↗</a> : <span>{item.status ?? "Forthcoming"}</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
