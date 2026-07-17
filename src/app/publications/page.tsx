/* eslint-disable @next/next/no-html-link-for-pages -- Dala owns document-lifetime WebGL state; returning to its route must reload the document. */
import type { Metadata } from "next";

import { PublicationArchive } from "@/components/publications/PublicationArchive";
import { archivePublications } from "@/lib/publications";

import "./publications.css";

export const metadata: Metadata = {
  title: "Publications",
  description: "A chronological archive of Ming Ma’s journal articles, working papers, and book chapters.",
  alternates: { canonical: "/publications" },
  openGraph: {
    title: "Publications — Ming Ma",
    description: "Research publications on AI governance, public administration, comparative politics, and digital society.",
    url: "/publications",
    type: "website",
  },
};

export default function PublicationsPage() {
  const scholarlyWorks = archivePublications.map((item) => ({
    "@type": "ScholarlyArticle",
    headline: item.title,
    author: item.authors,
    datePublished: item.year,
    isPartOf: item.venue,
    url: item.href,
  }));

  return (
    <main className="archive-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": scholarlyWorks }) }}
      />
      <nav className="archive-nav" aria-label="Publications navigation">
        <a href="/">Ming Ma</a>
        <a href="/#research">Research</a>
        <a href="mailto:m.ma@ipw.uni-hannover.de">Email</a>
      </nav>

      <header className="archive-heading">
        <p>Research record · 2018—2025</p>
        <h1>Publications</h1>
        <div>
          <p>A chronological record of peer-reviewed articles, work under review, and book contributions.</p>
          <span>{archivePublications.length} records</span>
        </div>
      </header>

      <PublicationArchive items={archivePublications} />

      <footer className="archive-footer">
        <a href="/">← Return to the research portfolio</a>
        <span>Last reviewed July 2026</span>
      </footer>
    </main>
  );
}
