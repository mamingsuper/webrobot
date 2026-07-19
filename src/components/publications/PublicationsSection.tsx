import { publications } from "@/data/content";

import { AbstractDisclosure } from "./AbstractDisclosure";
import { ParticleGlobe } from "./ParticleGlobe";
import styles from "./PublicationsSection.module.css";

function articleLinkLabel(link: string): string {
  return link.includes("doi.org") ? "DOI" : "Open article";
}

export function PublicationsSection() {
  return (
    <section aria-labelledby="publications-title" className={styles.section} id="publications">
      <div className={`${styles.shell} shell`}>
        <header className={styles.intro}>
          <div className={styles.introCopy}>
            <p className={styles.kicker}>Publications · 2018—2025</p>
            <h2 className={styles.title} id="publications-title">
              <span>Selected</span>
              <span>publications</span>
            </h2>
            <p className={styles.statement}>Ideas travel. Narratives align.</p>
            <p className={styles.introNote}>
              Peer-reviewed research on authoritarian narratives, institutional logics,
              emerging technology, and public governance.
            </p>
          </div>

          <ParticleGlobe />
        </header>

        <div className={styles.collection}>
          <div className={styles.collectionHeading}>
            <h3>Articles</h3>
            <p>{String(publications.articles.length).padStart(2, "0")} peer-reviewed works</p>
          </div>

          <ol className={styles.articleList}>
            {publications.articles.map((article, index) => {
              const isFeatured = index < 3;
              const number = String(index + 1).padStart(2, "0");

              return (
                <li className={styles.article} data-featured={isFeatured} key={article.title}>
                  <div aria-hidden="true" className={styles.articleNumber}>
                    {number}
                  </div>

                  <div className={styles.articleMeta}>
                    <p>{article.year}</p>
                    <p>{article.journal}</p>
                    {article.status ? <p className={styles.status}>{article.status}</p> : null}
                  </div>

                  <div className={styles.articleBody}>
                    {isFeatured ? <p className={styles.featuredLabel}>Featured research</p> : null}
                    <h4>{article.title}</h4>
                    <p className={styles.authors}>{article.authors}</p>

                    {article.abstract ? <AbstractDisclosure abstract={article.abstract} /> : null}
                  </div>

                  <div className={styles.articleLinks}>
                    {article.link ? (
                      <a href={article.link} rel="noreferrer" target="_blank">
                        {articleLinkLabel(article.link)}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <span className={styles.linkUnavailable}>Forthcoming</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className={styles.secondaryCollections}>
          <section aria-labelledby="books-title" className={styles.secondaryCollection}>
            <div className={styles.collectionHeading}>
              <h3 id="books-title">Books &amp; chapters</h3>
              <p>{String(publications.books.length).padStart(2, "0")} contribution</p>
            </div>

            <ol className={styles.secondaryList}>
              {publications.books.map((book, index) => (
                <li className={styles.secondaryItem} key={book.title}>
                  <span className={styles.typeLabel}>Book chapter</span>
                  <div className={styles.secondaryBody}>
                    <p className={styles.secondaryIndex}>{String(index + 1).padStart(2, "0")}</p>
                    <h4>{book.title}</h4>
                    <p>{book.chapter}</p>
                    <p className={styles.authors}>{book.authors}</p>
                  </div>
                  <a href={book.link} rel="noreferrer" target="_blank">
                    View book <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="working-papers-title" className={styles.secondaryCollection}>
            <div className={styles.collectionHeading}>
              <h3 id="working-papers-title">Working papers</h3>
              <p>{String(publications.workingPapers.length).padStart(2, "0")} active paper</p>
            </div>

            <ol className={styles.secondaryList}>
              {publications.workingPapers.map((paper, index) => (
                <li className={styles.secondaryItem} key={paper.title}>
                  <span className={styles.typeLabel}>Working paper</span>
                  <div className={styles.secondaryBody}>
                    <p className={styles.secondaryIndex}>{String(index + 1).padStart(2, "0")}</p>
                    <h4>{paper.title}</h4>
                    <p>
                      {paper.year} · {paper.status}
                    </p>
                    <p className={styles.authors}>{paper.authors}</p>
                  </div>
                  {paper.pdf ? (
                    <a href={paper.pdf} rel="noreferrer" target="_blank">
                      PDF <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span className={styles.linkUnavailable}>Draft in progress</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </section>
  );
}
