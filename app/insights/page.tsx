import type { Metadata } from "next";
import { Arrow, SiteFooter, SiteHeader } from "../components/site-chrome";
import { articles } from "./articles";

export const metadata: Metadata = {
  title: "Logistics Insights | Runex Logistics Inc.",
  description: "Practical guides about Canadian warehousing, 3PL fulfillment, FBA preparation, cross-docking and transportation.",
  alternates: { canonical: "/insights" },
};

const ARTICLES_PER_PAGE = 6;

type InsightsPageProps = {
  searchParams?: Promise<{ page?: string | string[] }>;
};

function pageHref(page: number) {
  return page === 1 ? "/insights" : `/insights?page=${page}`;
}

function paginationItems(currentPage: number, totalPages: number) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );

  return pages.flatMap<(number | string)>((page, index) => {
    const previous = pages[index - 1];
    return previous && page - previous > 1 ? [`ellipsis-${page}`, page] : [page];
  });
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const params = (await searchParams) ?? {};
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const requestedPage = Number.parseInt(rawPage ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(articles.length / ARTICLES_PER_PAGE));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const firstArticle = (currentPage - 1) * ARTICLES_PER_PAGE;
  const visibleArticles = articles.slice(firstArticle, firstArticle + ARTICLES_PER_PAGE);

  return (
    <main className="insights-page">
      <SiteHeader current="Insights" />
      <section className="insights-hero">
        <p className="eyebrow"><span /> Runex knowledge centre</p>
        <h1>Practical logistics insights.</h1>
        <p>Clear answers about warehousing, fulfillment, FBA preparation and freight movement in Canada.</p>
      </section>

      <section className="insights-index" aria-labelledby="latest-insights">
        <div className="insights-index-heading">
          <div><p className="eyebrow dark"><span /> Latest articles</p><h2 id="latest-insights">Built for better logistics decisions.</h2></div>
          <p>Each guide starts with a direct answer, then explains the workflow, trade-offs and questions to ask a provider.</p>
        </div>

        <div className="article-index-list">
          {visibleArticles.map((article, index) => (
            <article className="article-index-card" key={article.slug}>
              <div className="article-index-meta">
                <span>{String(firstArticle + index + 1).padStart(2, "0")}</span>
                <small>{article.category}</small>
              </div>
              <div className="article-index-main">
                <h3><a href={`/insights/${article.slug}`}>{article.title}</a></h3>
                <p>{article.excerpt}</p>
              </div>
              <div className="article-index-actions">
                <div className="article-card-footer"><time dateTime={article.publishedAt}>{article.publishedAt}</time><span>{article.readTime}</span></div>
                <a className="article-read-link" href={`/insights/${article.slug}`}>Read article <Arrow /></a>
              </div>
            </article>
          ))}
        </div>

        <nav className="article-pagination" aria-label="Insights pagination">
          {currentPage > 1 ? (
            <a className="pagination-direction" href={pageHref(currentPage - 1)} rel="prev">Previous</a>
          ) : (
            <span className="pagination-direction is-disabled" aria-disabled="true">Previous</span>
          )}
          <div className="pagination-pages">
            {paginationItems(currentPage, totalPages).map((item) =>
              typeof item === "string" ? (
                <span className="pagination-ellipsis" key={item} aria-hidden="true">…</span>
              ) : (
                <a
                  className={item === currentPage ? "is-current" : undefined}
                  href={pageHref(item)}
                  aria-current={item === currentPage ? "page" : undefined}
                  key={item}
                >
                  {item}
                </a>
              ),
            )}
          </div>
          {currentPage < totalPages ? (
            <a className="pagination-direction" href={pageHref(currentPage + 1)} rel="next">Next</a>
          ) : (
            <span className="pagination-direction is-disabled" aria-disabled="true">Next</span>
          )}
        </nav>
      </section>
      <section className="insights-cta"><div><small>NEED AN OPERATING PLAN?</small><h2>Talk through your freight with our team.</h2></div><a className="button button-primary" href="mailto:info@runexlogi.com?subject=Runex%20Logistics%20Inquiry">Contact Runex <Arrow /></a></section>
      <SiteFooter />
    </main>
  );
}
