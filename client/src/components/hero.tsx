import { motion, useReducedMotion } from "framer-motion";
import { Building2, FileText, Globe2, Mail, Network, Newspaper, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hero } from "@/data/content";

const easeOut = [0.16, 0.84, 0.44, 1] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();

  const reveal = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <header
      id="about"
      className="hero-shell relative overflow-hidden px-4 pb-14 pt-24 sm:px-6 lg:px-8 lg:pb-14 lg:pt-24"
      aria-labelledby="about-heading"
      data-snap
    >
      <div className="mx-auto grid w-full max-w-[1180px] items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <motion.div
          className="relative z-10"
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08 }}
        >
          <motion.div
            variants={reveal}
            transition={{ duration: 0.7, ease: easeOut }}
            className="flex items-center gap-5 sm:gap-6"
          >
            <img
              src={hero.avatar}
              alt="Portrait of Ming Ma"
              className="h-24 w-24 shrink-0 rounded-full border border-[color:var(--line)] object-cover shadow-[0_18px_42px_rgba(15,23,42,0.10)] sm:h-32 sm:w-32"
            />
            <div className="min-w-0">
              <h1
                id="about-heading"
                className="font-serif text-4xl font-medium leading-[0.94] tracking-normal text-[color:var(--ink)] sm:text-5xl xl:text-6xl"
              >
                {hero.name}
              </h1>
              <div className="mt-4 flex flex-col gap-1 text-lg leading-snug text-[color:var(--muted-ink)] sm:text-xl">
                <p className="font-semibold text-[color:var(--ink)]">{hero.role}</p>
                <p>{hero.affiliation}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={reveal}
            transition={{ duration: 0.7, ease: easeOut }}
            className="mt-8 max-w-[700px] space-y-3 text-base leading-relaxed text-[color:var(--ink)] sm:text-lg"
          >
            {hero.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </motion.div>

          <motion.div
            variants={reveal}
            transition={{ duration: 0.7, ease: easeOut }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[color:var(--ink)] px-5 text-[color:var(--paper)] hover:bg-[color:var(--teal-dark)]"
            >
              <a href={hero.cv} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                CV
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-[color:var(--line-strong)] bg-[color:var(--paper)] px-5 text-[color:var(--ink)] hover:bg-[color:var(--paper-strong)]"
            >
              <a href={`mailto:${hero.email}`}>
                <Mail className="h-4 w-4" />
                Email
              </a>
            </Button>
          </motion.div>
        </motion.div>

        <EmergingTechnologyMap />
      </div>
    </header>
  );
}

function EmergingTechnologyMap() {
  const reduceMotion = useReducedMotion();
  const float = (y: number, rotate: number, baseRotate = 0) =>
    reduceMotion
      ? undefined
      : {
          y: [0, y, 0],
          rotate: [baseRotate, baseRotate + rotate, baseRotate],
        };

  const stickerTransition = (duration: number, delay = 0) => ({
    duration,
    delay,
    repeat: reduceMotion ? 0 : Infinity,
    ease: "easeInOut" as const,
  });

  return (
    <motion.div
      className="relative z-10"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.12, ease: easeOut }}
      aria-label="Animated collage about misinformation, emerging technology, global politics, public services, and digital society"
    >
      <div className="collage-panel">
        <motion.svg
          className="collage-thread"
          viewBox="0 0 640 560"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {[
            "M320 278C232 148 166 127 105 137",
            "M329 270C397 135 485 116 548 143",
            "M318 292C229 418 159 438 101 404",
            "M338 294C422 428 496 439 556 405",
          ].map((path, index) => (
            <motion.path
              key={path}
              d={path}
              stroke={index % 2 === 0 ? "#2f6f6a" : "#c78132"}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="7 12"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ duration: reduceMotion ? 0 : 1.2, delay: index * 0.1, ease: easeOut }}
            />
          ))}
        </motion.svg>

        <motion.div
          className="collage-sticker collage-sticker-main"
          animate={float(-8, -1.2, -2)}
          transition={stickerTransition(7.2)}
        >
          <span className="collage-icon">
            <Newspaper className="h-8 w-8" />
          </span>
          <span className="collage-title">(mis)information</span>
          <span className="collage-caption">claims, rumors, narratives</span>
        </motion.div>

        <motion.div
          className="collage-sticker collage-sticker-global"
          animate={float(7, 1.4, -5)}
          transition={stickerTransition(8, 0.2)}
        >
          <span className="collage-icon">
            <Globe2 className="h-7 w-7" />
          </span>
          <span className="collage-title">global politics</span>
          <span className="collage-caption">conflict, blocs, power</span>
        </motion.div>

        <motion.div
          className="collage-sticker collage-sticker-tech"
          animate={float(-6, -1, 4)}
          transition={stickerTransition(7.5, 0.5)}
        >
          <span className="collage-icon">
            <Network className="h-7 w-7" />
          </span>
          <span className="collage-title">emerging tech</span>
          <span className="collage-caption">AI systems, platforms</span>
        </motion.div>

        <motion.div
          className="collage-sticker collage-sticker-public"
          animate={float(8, -1.6, 3)}
          transition={stickerTransition(8.4, 0.35)}
        >
          <span className="collage-icon">
            <Building2 className="h-7 w-7" />
          </span>
          <span className="collage-title">public services</span>
          <span className="collage-caption">encounters, decisions</span>
        </motion.div>

        <motion.div
          className="collage-sticker collage-sticker-digital"
          animate={float(-7, 1.2, -4)}
          transition={stickerTransition(7.9, 0.6)}
        >
          <span className="collage-icon">
            <Smartphone className="h-7 w-7" />
          </span>
          <span className="collage-title">digital society</span>
          <span className="collage-caption">feeds, publics, attention</span>
        </motion.div>

        <motion.div
          className="collage-chip collage-chip-a"
          animate={reduceMotion ? undefined : { x: [0, 12, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 6, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="collage-chip collage-chip-b"
          animate={reduceMotion ? undefined : { x: [0, -10, 0], opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 7, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
