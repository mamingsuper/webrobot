import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { projects } from "@/data/content";

const easeOut = [0.16, 0.84, 0.44, 1] as const;

export function ProjectsSection() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const selectPrevious = () => {
    setActiveIndex((current) => (current === 0 ? projects.length - 1 : current - 1));
  };

  const selectNext = () => {
    setActiveIndex((current) => (current === projects.length - 1 ? 0 : current + 1));
  };

  return (
    <section id="projects" className="section-shell projects-shell" aria-labelledby="projects-heading" data-snap>
      <div className="project-section-heading">
        <h2 id="projects-heading" className="section-heading mt-0">
          Research projects
        </h2>
        <div className="project-controls" aria-label="Select project">
          <button type="button" className="project-control-button" onClick={selectPrevious} aria-label="Previous project">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="project-dots" aria-hidden="true">
            {projects.map((project, index) => (
              <span key={project.title} className={index === activeIndex ? "is-active" : ""} />
            ))}
          </div>
          <button type="button" className="project-control-button" onClick={selectNext} aria-label="Next project">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <motion.div
        className="project-card-group"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.18 }}
        transition={{ staggerChildren: 0.08 }}
        role="list"
        aria-label="Research project cards"
      >
        {projects.map((project, index) => (
          <ProjectCard
            key={project.title}
            project={project}
            index={index}
            active={activeIndex === index}
            reduceMotion={Boolean(reduceMotion)}
            onSelect={() => setActiveIndex(index)}
          />
        ))}
      </motion.div>
    </section>
  );
}

function ProjectCard({
  project,
  index,
  active,
  reduceMotion,
  onSelect,
}: {
  project: (typeof projects)[number];
  index: number;
  active: boolean;
  reduceMotion: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.article
      role="listitem"
      className={`project-card ${active ? "is-active" : ""}`}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: active ? 1.02 : 0.94 }}
      whileInView={{
        opacity: active ? 1 : 0.5,
        y: reduceMotion ? 0 : active ? -10 : 12,
        scale: active ? 1.02 : 0.94,
      }}
      animate={{
        opacity: active ? 1 : 0.5,
        y: reduceMotion ? 0 : active ? -10 : 12,
        scale: active ? 1.02 : 0.94,
      }}
      viewport={{ once: false, amount: 0.18 }}
      transition={{ duration: 0.32, ease: easeOut }}
      onMouseEnter={onSelect}
      onFocus={onSelect}
      onClick={onSelect}
      tabIndex={0}
      aria-label={`${project.title}${active ? ", selected" : ""}`}
    >
      <div className="project-sticker-stage">
        <motion.img
          src={project.sticker ?? project.img}
          alt={project.stickerAlt ?? project.title}
          loading={index === 0 ? "eager" : "lazy"}
          width={720}
          height={520}
          className="project-sticker"
          animate={
            reduceMotion
              ? undefined
              : {
                  y: active ? [0, -7, 0] : [0, index % 2 === 0 ? -4 : 4, 0],
                  rotate: active ? [0, index % 2 === 0 ? -0.8 : 0.8, 0] : [0, 0, 0],
                }
          }
          transition={{
            duration: active ? 6.8 : 8.2,
            repeat: reduceMotion ? 0 : Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="project-copy">
        <p className="project-focus">{project.focus}</p>
        <h3 className="project-title">
          {project.link ? (
            <a href={project.link} target="_blank" rel="noopener noreferrer">
              {project.title}
            </a>
          ) : (
            project.title
          )}
        </h3>

        <p className="project-card-description">{project.desc}</p>

        <div className="project-methods">
          {project.methods.map((method) => (
            <span key={method}>{method}</span>
          ))}
        </div>

        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="project-link"
            onClick={(event) => event.stopPropagation()}
          >
            Project page
            <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </motion.article>
  );
}
