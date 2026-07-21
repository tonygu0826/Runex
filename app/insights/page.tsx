import type { Metadata } from "next";
import { Arrow, SiteFooter, SiteHeader } from "../components/site-chrome";
import { articles } from "./articles";

export const metadata: Metadata = {
  title: "Logistics Insights | Runex Logistics Inc.",
  description: "Practical guides about Canadian warehousing, 3PL fulfillment, FBA preparation, cross-docking and transportation.",
  alternates: { canonical: "/insights" },
};

export default function InsightsPage() {
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
        <div className="article-index-grid">
          {articles.map((article, index) => (
            <article className="article-index-card" key={article.slug}>
              <div className="article-index-meta"><span>0{index + 1}</span><small>{article.category}</small></div>
              <h3><a href={`/insights/${article.slug}`}>{article.title}</a></h3>
              <p>{article.excerpt}</p>
              <div className="article-card-footer"><time dateTime={article.publishedAt}>{article.publishedAt}</time><span>{article.readTime}</span></div>
              <a className="article-read-link" href={`/insights/${article.slug}`}>Read article <Arrow /></a>
            </article>
          ))}
        </div>
      </section>
      <section className="insights-cta"><div><small>NEED AN OPERATING PLAN?</small><h2>Talk through your freight with our team.</h2></div><a className="button button-primary" href="mailto:tony@fengyecang.com?subject=Runex%20Logistics%20Inquiry">Contact Runex <Arrow /></a></section>
      <SiteFooter />
    </main>
  );
}
