import { publications } from "@/data/content";

export type PublicationKind = "Article" | "Working paper" | "Book chapter";

export type ArchivePublication = {
  id: string;
  kind: PublicationKind;
  year: string;
  title: string;
  authors: string;
  venue: string;
  detail?: string;
  status?: string;
  href?: string;
  abstract?: string;
};

export function publicationId(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’'“”\"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const archivePublications: ArchivePublication[] = [
  ...publications.articles.map((item) => ({
    id: publicationId(item.title),
    kind: "Article" as const,
    year: item.year,
    title: item.title,
    authors: item.authors,
    venue: item.journal,
    detail: item.status,
    status: item.status,
    href: item.link,
    abstract: item.abstract,
  })),
  ...publications.workingPapers.map((item) => ({
    id: publicationId(item.title),
    kind: "Working paper" as const,
    year: item.year,
    title: item.title,
    authors: item.authors,
    venue: item.status,
    status: item.status,
    href: item.pdf,
  })),
  ...publications.books.map((item) => {
    const year = item.authors.match(/\((\d{4})\)/)?.[1] ?? "2018";
    return {
      id: publicationId(item.title),
      kind: "Book chapter" as const,
      year,
      title: item.title,
      authors: item.authors,
      venue: item.chapter,
      href: item.link,
    };
  }),
].sort((a, b) => Number(b.year) - Number(a.year));

export const featuredPublications = archivePublications
  .filter((item) => item.kind === "Article")
  .slice(0, 4);
