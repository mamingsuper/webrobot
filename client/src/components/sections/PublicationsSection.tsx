import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, FileText, LibraryBig } from "lucide-react";
import { publications, type BookItem, type PublicationItem, type WorkingPaperItem } from "@/data/content";

const easeOut = [0.16, 0.84, 0.44, 1] as const;

export function PublicationsSection() {
  return (
    <section id="publications" className="section-shell" aria-labelledby="pubs-heading" data-snap>
      <div className="mb-10">
        <h2 id="pubs-heading" className="publication-heading">
          Publications
        </h2>
      </div>

      <div className="grid gap-7">
        <PublicationGroup
          title="Books"
          icon={<BookOpen className="h-5 w-5" />}
          items={publications.books.map((book) => (
            <BookRow key={book.title} book={book} />
          ))}
        />

        <PublicationGroup
          title="Articles"
          icon={<LibraryBig className="h-5 w-5" />}
          items={publications.articles.map((article) => (
            <ArticleRow key={article.title} article={article} />
          ))}
        />

        <PublicationGroup
          title="Working Papers"
          icon={<FileText className="h-5 w-5" />}
          items={publications.workingPapers.map((paper) => (
            <WorkingPaperRow key={paper.title} paper={paper} />
          ))}
        />
      </div>
    </section>
  );
}

function PublicationGroup({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: React.ReactNode[];
}) {
  return (
    <motion.section
      className="paper-panel rounded-[1.5rem]"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.5, ease: easeOut }}
      aria-label={title}
    >
      <div className="flex items-center gap-3 border-b border-[color:var(--line)] px-5 py-4 sm:px-6">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--mint)] text-[color:var(--teal-dark)]">
          {icon}
        </span>
        <h3 className="font-serif text-2xl font-medium text-[color:var(--ink)]">{title}</h3>
      </div>
      <div className="divide-y divide-[color:var(--line)]">{items}</div>
    </motion.section>
  );
}

function BookRow({ book }: { book: BookItem }) {
  return (
    <article className="px-5 py-5 sm:px-6">
      <h4 className="max-w-4xl text-xl font-semibold leading-tight text-[color:var(--ink)]">
        <a
          href={book.link}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-[color:var(--amber-soft)] decoration-2 underline-offset-4 transition hover:decoration-[color:var(--amber)]"
        >
          {book.title}
        </a>
      </h4>
      <p className="mt-2 text-base font-medium text-[color:var(--muted-ink)]">{book.authors}</p>
      <p className="mt-1 text-sm text-[color:var(--soft-ink)]">{book.chapter}</p>
    </article>
  );
}

function ArticleRow({ article }: { article: PublicationItem }) {
  return (
    <article className="grid gap-4 px-5 py-6 sm:px-6 lg:grid-cols-[7.5rem_1fr]">
      <div>
        <span className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--paper-strong)] px-3 py-1 text-sm font-bold text-[color:var(--teal-dark)]">
          {article.year}
        </span>
      </div>
      <div>
        <h4 className="max-w-4xl text-xl font-semibold leading-tight text-[color:var(--ink)]">
          {article.link ? (
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[color:var(--amber-soft)] decoration-2 underline-offset-4 transition hover:decoration-[color:var(--amber)]"
            >
              {article.title}
            </a>
          ) : (
            article.title
          )}
        </h4>
        <p className="mt-2 text-base font-medium text-[color:var(--muted-ink)]">{article.authors}</p>
        <p className="mt-1 text-sm text-[color:var(--soft-ink)]">
          {article.journal}
          {article.status ? ` · ${article.status}` : ""}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {article.link && (
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--teal-dark)] hover:text-[color:var(--ink)]"
            >
              Full text
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
          {article.abstract && (
            <details className="group w-full text-sm text-[color:var(--muted-ink)] sm:w-auto">
              <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-[color:var(--line)] px-3 py-1.5 font-bold text-[color:var(--ink)] transition hover:bg-[color:var(--paper-strong)]">
                Abstract
                <span className="transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-3xl rounded-[1rem] bg-[color:var(--paper-strong)] p-4 text-base leading-relaxed text-[color:var(--muted-ink)]">
                {article.abstract}
              </p>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}

function WorkingPaperRow({ paper }: { paper: WorkingPaperItem }) {
  return (
    <article className="grid gap-4 px-5 py-6 sm:px-6 lg:grid-cols-[7.5rem_1fr]">
      <div>
        <span className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--paper-strong)] px-3 py-1 text-sm font-bold text-[color:var(--teal-dark)]">
          {paper.year}
        </span>
      </div>
      <div>
        <h4 className="max-w-4xl text-xl font-semibold leading-tight text-[color:var(--ink)]">
          {paper.title}
        </h4>
        <p className="mt-2 text-base font-medium text-[color:var(--muted-ink)]">{paper.authors}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-[color:var(--soft-ink)]">{paper.status}</span>
          {paper.pdf && (
            <a
              href={paper.pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--teal-dark)] hover:text-[color:var(--ink)]"
            >
              PDF
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
