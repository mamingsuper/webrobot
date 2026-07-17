"use client";

import Image from "next/image";

import { hero, projects } from "@/data/content";
import { archivePublications } from "@/lib/publications";

function refreshPortfolioLayout() {
  requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
}

const journalNames = [
  "Perspectives on Politics",
  "Political Research Quarterly",
  "Journal of Contemporary China",
  "China Review",
  "China Perspectives",
] as const;

function BiographyParagraph({ text }: { text: string }) {
  const pattern = new RegExp(`(${journalNames.join("|")})`, "g");

  return (
    <p>
      {text.split(pattern).map((part, index) =>
        journalNames.includes(part as (typeof journalNames)[number]) ? (
          <cite key={`${part}-${index}`}>{part}</cite>
        ) : (
          part
        ),
      )}
    </p>
  );
}

export function PortfolioHero() {
  return (
    <>
      <div anchor-target="landing" />
      <section className="section portfolio-act hero-act js-section" section-name="landing">
        <div className="hero-profile" data-reveal>
          <Image
            className="hero-avatar"
            src={hero.avatar}
            alt="Portrait of Ming Ma"
            width={160}
            height={160}
            priority
          />
          <div className="hero-identity">
            <h1 className="hero-name">{hero.name}</h1>
            <p className="hero-role">
              {hero.role}<br />
              <span>{hero.affiliation}</span>
            </p>
          </div>
          <div className="hero-biography">
            {hero.bio.map((paragraph) => (
              <BiographyParagraph key={paragraph} text={paragraph} />
            ))}
          </div>
          <a className="hero-email" href={`mailto:${hero.email}`}>{hero.email}</a>
        </div>
        <div className="scroll-cue" aria-hidden="true"><span>Scroll</span><i /></div>
      </section>
    </>
  );
}

export function PortfolioResearch() {
  return (
    <>
      <div anchor-target="research" />
      <section className="section portfolio-act research-act js-section" section-name="research">
        <header className="act-heading" data-reveal>
          <h2>Project</h2>
        </header>
        <div className="research-list" data-reveal>
          {projects.map((project, index) => (
            <details className="research-record" key={project.title} onToggle={refreshPortfolioLayout}>
              <summary>
                <span className="record-number" aria-hidden="true">0{index + 1}</span>
                <span className="record-title" role="heading" aria-level={3}>{project.title}</span>
                <span className="record-toggle">Detail</span>
              </summary>
              <div className="record-body">
                {project.desc.trim() ? (
                  <p className="record-description">{project.desc}</p>
                ) : null}
                {project.focus.trim() ? (
                  <p className="record-focus"><span>Focus</span>{project.focus}</p>
                ) : null}
                {project.methods.length ? (
                  <p className="record-methods"><span>Methods</span>{project.methods.join(" · ")}</p>
                ) : null}
                {project.link ? (
                  <a className="text-arrow" href={project.link} target="_blank" rel="noreferrer">Visit project ↗</a>
                ) : (
                  <a className="text-arrow" href={`mailto:${hero.email}`}>Email about this project ↗</a>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

export function PortfolioPublications() {
  return (
    <>
      <div anchor-target="publications" />
      <section className="section portfolio-act publications-act js-section" section-name="publications">
        <header className="act-heading publications-heading" data-reveal>
          <h2>Publication</h2>
        </header>
        <ol className="publication-ledger" data-reveal>
          {archivePublications.map((article) => (
            <li key={article.id} id={article.id}>
              <div className="publication-meta">
                <span className="publication-year">{article.year}</span>
                <span>{article.kind}</span>
              </div>
              <article>
                <h3>{article.title}</h3>
                <p className="publication-authors">{article.authors}</p>
                <p className="publication-journal">
                  <cite>{article.venue}</cite>
                  {article.status ? <span>{article.status}</span> : null}
                </p>
                <div className="publication-actions">
                  {article.abstract?.trim() ? (
                    <details className="publication-abstract" onToggle={refreshPortfolioLayout}>
                      <summary>Abstract</summary>
                      <p>{article.abstract}</p>
                    </details>
                  ) : null}
                  {article.href ? <a href={article.href} target="_blank" rel="noreferrer">Publisher version ↗</a> : null}
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
