
import { motion } from "framer-motion";
import { Network, GitPullRequest } from "lucide-react";
import { projects } from "@/data/content";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
};

const staggerChildren = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export function ProjectsSection() {
    return (
        <section
            id="projects"
            className="py-20 sm:py-24 px-4 md:px-8 relative z-10"
            aria-labelledby="projects-heading"
            data-snap
        >
            <div className="max-w-4xl mx-auto relative">
                <motion.h2
                    id="projects-heading"
                    className="flex items-center justify-center gap-3 mb-10 heading-2 text-neutral-900"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <Network className="w-8 h-8 text-amber-600 motion-safe:animate-pulse" />
                    <span>Projects</span>
                </motion.h2>
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    variants={staggerChildren}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                >
                    {projects.map((project, i) => (
                        <motion.article
                            key={i}
                            variants={fadeInUp}
                            className="bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:bg-white/80 focus-within:shadow-md focus-within:ring-2 focus-within:ring-amber-500 outline-none"
                            tabIndex={0}
                        >
                            <div className="aspect-[3/2] bg-white/50 rounded-xl overflow-hidden mb-4 relative shadow-inner">
                                <img
                                    src={project.img}
                                    alt={project.title}
                                    loading="lazy"
                                    width={640}
                                    height={420}
                                    className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-110"
                                />
                            </div>
                            <div className="p-2">
                                <div className="flex items-start gap-2 mb-3">
                                    <GitPullRequest className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
                                    <h3 className="text-lg font-bold text-neutral-900 leading-snug">
                                        {project.link ? (
                                            <a
                                                href={project.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline decoration-amber-200 hover:decoration-amber-500 transition-all"
                                            >
                                                {project.title}
                                            </a>
                                        ) : (
                                            project.title
                                        )}
                                    </h3>
                                </div>
                                <details className="group text-neutral-700 text-base leading-relaxed">
                                    <summary className="cursor-pointer list-none select-none text-amber-700 hover:text-amber-800 font-medium mb-1 inline-flex items-center gap-1 transition-colors">
                                        <span className="w-4 h-4 inline-flex items-center justify-center border border-amber-300 rounded text-[10px] bg-amber-50 group-open:bg-amber-100 transition-colors">
                                            <span className="group-open:hidden">+</span>
                                            <span className="hidden group-open:block">-</span>
                                        </span>
                                        Description
                                    </summary>
                                    <p className="mt-2 pl-5 text-sm text-neutral-600 whitespace-pre-line border-l-2 border-amber-100">
                                        {project.desc.trim()}
                                    </p>
                                </details>
                            </div>
                        </motion.article>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
