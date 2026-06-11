import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { updates } from "@/data/content";

const easeOut = [0.16, 0.84, 0.44, 1] as const;

export function UpdatesSection() {
  return (
    <section id="updates" className="section-shell" aria-labelledby="updates-heading" data-snap>
      <div className="mx-auto max-w-3xl text-center">
        <h2 id="updates-heading" className="section-heading mx-auto mt-0">
          Recent updates
        </h2>
      </div>

      <motion.ol
        className="updates-tree relative mx-auto mt-12 max-w-5xl"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.08 }}
        aria-label="Recent chronological updates"
      >
        <span className="updates-tree-axis" aria-hidden="true" />

        {updates.map((update, index) => {
          const isLeft = index % 2 === 0;

          return (
            <motion.li
              key={`${update.date}-${update.title}`}
              className="updates-tree-item"
              data-side={isLeft ? "left" : "right"}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.48, ease: easeOut }}
            >
              <span className="updates-tree-dot" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--amber)]" />
              </span>

              <article className="updates-card paper-panel rounded-[1.25rem] p-5 text-left">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[color:var(--teal-dark)]">
                    <CheckCircle2 className="h-4 w-4" />
                    {update.category}
                  </span>
                  <time className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--soft-ink)]">
                    <CalendarDays className="h-4 w-4" />
                    {update.date}
                  </time>
                </div>
                <h3 className="mt-3 text-xl font-semibold leading-tight text-[color:var(--ink)]">
                  {update.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-[color:var(--muted-ink)]">
                  {update.content}
                </p>
              </article>
            </motion.li>
          );
        })}
      </motion.ol>
    </section>
  );
}
