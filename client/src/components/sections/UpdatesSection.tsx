
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { updates } from "@/data/content";

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

export function UpdatesSection() {
    return (
        <section
            id="updates"
            className="py-20 sm:py-24 px-4 md:px-8 relative z-10"
            aria-labelledby="updates-heading"
            data-snap
        >
            <div className="max-w-3xl mx-auto">
                <motion.h2
                    id="updates-heading"
                    className="flex items-center justify-center gap-3 mb-10 heading-2 text-neutral-900"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <Brain className="w-8 h-8 text-amber-600 motion-safe:animate-pulse" />
                    <span>Recent Updates</span>
                </motion.h2>
                <motion.ol
                    className="relative ml-3 pl-6 border-l border-amber-200/50 space-y-8"
                    variants={staggerChildren}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    aria-label="Recent chronological updates"
                >
                    {updates.map((u, i) => (
                        <motion.li
                            key={i}
                            variants={fadeInUp}
                            className="relative focus-within:ring-2 focus-within:ring-amber-500 rounded-xl outline-none p-4 hover:bg-white/40 transition-colors duration-300"
                        >
                            <span
                                className="absolute -left-[30px] top-6 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-white/80"
                                aria-hidden="true"
                            />
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <h3 className="text-lg font-semibold text-neutral-900 leading-snug">
                                        {u.title}
                                    </h3>
                                    <time className="text-sm font-medium tracking-wide uppercase text-neutral-500">
                                        {u.date}
                                    </time>
                                </div>
                                <p className="text-base text-neutral-700 leading-relaxed max-w-prose">
                                    {u.content}
                                </p>
                            </div>
                        </motion.li>
                    ))}
                </motion.ol>
            </div>
        </section>
    );
}
