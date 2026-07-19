/* eslint-disable @next/next/no-img-element -- The original Dala carousel runtime targets native image nodes. */

import { hero, projects } from "@/data/content";
import { featuredPublications } from "@/lib/publications";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="M14.57 8.716H0v-2h14.57v2zM11.278 3l4.71 4.72-1.416 1.413-4.71-4.72L11.278 3zM15.978 7.723l-4.7 4.71-1.416-1.413 4.7-4.71 1.416 1.413z" fill="currentColor" />
    </svg>
  );
}

function SliderControl({ direction }: { direction: "previous" | "next" }) {
  const previous = direction === "previous";
  return (
    <button
      type="button"
      className={`team-slider__control ${previous ? "team-slider__previous" : "team-slider__next"} | ${previous ? "js-slider-prev" : "js-slider-next"}`}
      aria-label={previous ? "Previous project" : "Next project"}
    >
      <span className="sr">{previous ? "Previous project" : "Next project"}</span>
      <div className={`team-slider__control-bg | ${previous ? "js-slider-prev-bg" : "js-slider-next-bg"}`} />
      <div className={`team-slider__control-hover | ${previous ? "js-slider-prev-hover" : "js-slider-next-hover"}`} />
      <ArrowIcon />
    </button>
  );
}

const projectPresentation = [
  {
    title: "BiASE-AI",
    focus: "AI & public services",
    summary:
      "How AI reshapes frontline services, bias, accountability, and citizens’ ability to contest decisions.",
  },
  {
    title: "SCRIPTS",
    focus: "Cross-border narratives",
    summary:
      "How authoritarian states construct competing narratives—and how publics receive them across borders.",
  },
  {
    title: "Generative AI & Politics",
    focus: "Political communication",
    summary:
      "How generative AI is adopted, used, and governed in political communication and non-democratic regimes.",
  },
] as const;

export function ProjectCarousel() {
  return (
    <div className="team portfolio-projects">
      <div
        className="team__head js-team-head"
        animate-mq="sm"
        animate-from="y: '-5vw', scrollTrigger: { scrub: 0.5, once: false, start: 'top bottom' }"
      >
        <h2
          className="t-56 t-lh-1 t-64@sm t-lh-1.2@sm t-104@md t-lh-1.1@md -t-ls-0.03 t-400 mb-2@xs mb-2.5@sm mb-3@md"
          animate-from="preset: 'splitTextRotateIn', scrollTrigger: { start: 'top bottom' }"
        >
          Current research
        </h2>
      </div>

      <div className="team-slider | js-slider">
        <div className="team-slider__slides-container">
          <ul className="team-slider__slides | js-slides">
            {Array.from({ length: 6 }, (_, repetitionIndex) =>
              projects.map((project) => (
                <li
                  key={`${repetitionIndex}-${project.title}`}
                  className="team-card | js-slide"
                  slide-id={project.title}
                >
                  <div className="team-card__inner">
                    <img
                      className="team-card__image | js-slide-image"
                      src={project.img}
                      alt={project.stickerAlt ?? project.title}
                      loading="lazy"
                    />
                  </div>
                </li>
              )),
            )}
          </ul>
        </div>

        <ul className="team-slider__content portfolio-project-content-list">
          {projects.map((project, index) => (
            <li className="team-slider__content__item" key={project.title}>
              <div className="team-card__content portfolio-project-content | js-slide-content" slide-id={project.title}>
                <span className="t-16 t-lh-1.2 t-ls-0.05 t-600 t-uppercase mb-1 t-purple | js-role">
                  {projectPresentation[index].focus}
                </span>
                <h3
                  className="t-40 t-lh-1 t-56@md t-lh-0.9@md t-lh-1.2@md -t-ls-0.03 t-400 mb-1 | js-name"
                  aria-label={project.title}
                >
                  {projectPresentation[index].title}
                </h3>
                <p className="portfolio-project-description">{projectPresentation[index].summary}</p>
                <div className="team-card__social">
                  <a
                    className="team-card__social__link portfolio-project-link | js-social-icon"
                    href={project.link ?? `mailto:${hero.email}`}
                    target={project.link ? "_blank" : undefined}
                    rel={project.link ? "noreferrer" : undefined}
                  >
                    {project.link ? "Explore project ↗" : "Discuss this research ↗"}
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="team-slider__controls">
          <SliderControl direction="previous" />
          <SliderControl direction="next" />
        </div>
      </div>

      <div animate-from="y: '-5vw', scrollTrigger: { trigger: '.js-team-head', scrub: 0.5, once: false, start: 'top bottom' }">
        <h3
          className="t-36 t-lh-1 -t-ls-0.03 t-400 mt-5@sm"
          animate-from="preset: 'splitTextRotateIn', rotate: 7, delay: 0.5, duration: 0.8, scrollTrigger: { start: 'top bottom' }"
        >
          Methods and themes.
        </h3>
        <div
          className="team__body"
          animate-from="preset: 'splitTextRotateIn', rotate: 7, delay: 1, duration: 0.8, scrollTrigger: { start: 'top bottom' }, children: 'p'"
        >
          <p className="t-20 t-lh-1.5 -t-ls-0.03 t-400">
            {hero.methods.join(" · ")}
          </p>
          <p className="t-20 t-lh-1.5 -t-ls-0.03 t-400">
            {hero.researchThemes.join(" · ")}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PublicationShowcase() {
  return (
    <section className="publication-preview" aria-labelledby="publication-preview-title">
      <div className="publication-preview-head">
        <p>Selected record · newest first</p>
        <h2 id="publication-preview-title">Publications</h2>
        <a href="/publications">View chronological archive ↗</a>
      </div>
      <ol className="publication-preview-list">
        {featuredPublications.map((article, index) => (
          <li key={article.id}>
            <a href={`/publications#${article.id}`}>
              <span className="publication-preview-index">0{index + 1}</span>
              <span className="publication-preview-copy">
                <span className="publication-preview-meta">{article.year} · {article.venue}{article.status ? ` · ${article.status}` : ""}</span>
                <strong>{article.title}</strong>
                <span className="publication-preview-authors">{article.authors}</span>
              </span>
              <span className="publication-preview-arrow" aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ol>
      <a className="publication-preview-all" href="/publications">All publications · {new Date().getFullYear()} archive ↗</a>
    </section>
  );
}
