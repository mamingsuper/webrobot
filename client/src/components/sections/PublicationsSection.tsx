
import { motion } from "framer-motion";
import { FileCode2 } from "lucide-react";
import { publications } from "@/data/content";

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

export function PublicationsSection() {
    return (
        <section
            id="publications"
            className="py-24 sm:py-28 px-4 md:px-8 relative z-10"
            aria-labelledby="pubs-heading"
            data-snap
        >
            <div className="max-w-4xl mx-auto relative">
                <motion.h2
                    id="pubs-heading"
                    className="flex items-center justify-center gap-3 mb-12 heading-2 text-neutral-900"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <FileCode2 className="w-8 h-8 text-amber-600 motion-safe:animate-pulse" />
                    <span>Publications</span>
                </motion.h2>

                {/* Books */}
                <div className="mb-14">
                    <h3 className="text-xl font-bold text-neutral-800 mb-5 flex items-center gap-2 border-b border-neutral-200 pb-2">
                        <svg
                            className="w-6 h-6 text-amber-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                        </svg>
                        Books
                    </h3>
                    <motion.div
                        className="space-y-3"
                        variants={staggerChildren}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                    >
                        {publications.books.map((book, i) => (
                            <motion.div
                                key={i}
                                variants={fadeInUp}
                                className="rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm p-4 md:p-6 shadow-sm hover:bg-white/80 transition-all duration-300"
                            >
                                <h4 className="text-lg font-bold text-neutral-900 leading-snug">
                                    <a
                                        href={book.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-amber-600 transition-colors"
                                    >
                                        {book.title}
                                    </a>
                                </h4>
                                <p className="mt-3 text-base text-neutral-700 leading-relaxed font-medium">
                                    {book.authors}
                                </p>
                                <p className="text-sm text-neutral-600 leading-relaxed mt-1">
                                    {book.chapter}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Articles */}
                <div className="mb-14">
                    <h3 className="text-xl font-bold text-neutral-800 mb-5 flex items-center gap-2 border-b border-neutral-200 pb-2">
                        <svg
                            className="w-6 h-6 text-amber-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                            />
                        </svg>
                        Articles
                    </h3>
                    <motion.div
                        className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-md divide-y divide-gray-100/50 shadow-sm"
                        variants={staggerChildren}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                    >
                        {publications.articles.map((article, i) => (
                            <motion.div key={i} variants={fadeInUp} className="px-5 md:px-6 py-6 hover:bg-white/40 transition-colors">
                                <div className="flex flex-wrap items-baseline justify-between gap-3">
                                    <h4 className="text-lg font-bold text-neutral-900 leading-snug max-w-2xl">
                                        {article.title}
                                    </h4>
                                    <span className="text-sm font-bold uppercase tracking-wide text-amber-600/80 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                        {article.year}
                                    </span>
                                </div>
                                <p className="mt-2 text-base text-neutral-700 leading-relaxed">
                                    {article.authors}
                                </p>
                                <p className="text-sm text-neutral-500 font-medium mt-1">
                                    {article.journal} {article.status && `• ${article.status}`}
                                </p>
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    {article.link && (
                                        <a
                                            href={article.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full bg-neutral-900 text-white px-4 py-1.5 text-sm font-medium hover:bg-neutral-700 transition-colors shadow-md hover:shadow-lg"
                                        >
                                            Full text
                                            <svg
                                                className="w-3.5 h-3.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 5h6m0 0v6m0-6L10 14"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 19l6-6"
                                                />
                                            </svg>
                                        </a>
                                    )}
                                    {article.abstract && (
                                        <details className="text-sm text-neutral-700 group">
                                            <summary className="cursor-pointer text-amber-700 hover:text-amber-800 font-semibold px-3 py-1.5 rounded-full hover:bg-amber-50 transition-colors list-none inline-flex items-center gap-1">
                                                Abstract <span className="text-xs transition-transform group-open:rotate-180">▼</span>
                                            </summary>
                                            <p className="mt-4 p-5 bg-white/60 rounded-xl text-neutral-800 leading-relaxed w-full border border-neutral-100 shadow-sm text-lg">
                                                {article.abstract}
                                            </p>
                                        </details>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Working Papers */}
                <div className="mt-16">
                    <h3 className="text-xl font-bold text-neutral-800 mb-5 flex items-center gap-2 border-b border-neutral-200 pb-2">
                        <svg
                            className="w-6 h-6 text-amber-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Working Papers
                    </h3>
                    <motion.div
                        className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-md divide-y divide-gray-100/50 shadow-sm"
                        variants={staggerChildren}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                    >
                        {publications.workingPapers.map((paper, i) => (
                            <motion.div key={i} variants={fadeInUp} className="px-5 md:px-6 py-6 hover:bg-white/40 transition-colors">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h4 className="text-lg font-bold text-neutral-900 leading-snug max-w-2xl">
                                        {paper.title}
                                    </h4>
                                    <span className="text-sm font-bold uppercase tracking-wide text-amber-600/80 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                        {paper.year}
                                    </span>
                                </div>
                                <p className="mt-2 text-base text-neutral-700 leading-relaxed">
                                    {paper.authors}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-4">
                                    <span className="text-sm text-neutral-500 font-medium italic">
                                        Status: {paper.status}
                                    </span>
                                    {paper.pdf && (
                                        <a
                                            href={paper.pdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors border border-red-100"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                />
                                            </svg>
                                            PDF
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
