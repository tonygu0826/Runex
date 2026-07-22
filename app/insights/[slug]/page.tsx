import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Arrow, SiteFooter, SiteHeader } from "../../components/site-chrome";
import { getService } from "../../solutions/services";
import { articles, getArticle } from "../articles";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} | Runex Logistics`,
    description: article.description,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      publishedTime: article.publishedAt,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const articleUrl = `https://runexlogi.com/insights/${article.slug}`;
  const serviceByCategory: Record<string, string> = {
    "3PL & Warehousing": "warehousing-fulfillment-canada",
    "Fulfillment": "warehousing-fulfillment-canada",
    "FBA & E-commerce": "fba-ecommerce-prep-canada",
    "Distribution": "transportation-cross-docking-canada",
    "Supply Chain": "transportation-cross-docking-canada",
  };
  const relatedService = getService(serviceByCategory[article.category]);
  const relatedArticles = articles
    .filter((item) => item.slug !== article.slug && item.category === article.category)
    .slice(0, 3);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      datePublished: article.publishedAt,
      dateModified: article.publishedAt,
      mainEntityOfPage: articleUrl,
      author: { "@type": "Organization", name: "Runex Logistics Inc." },
      publisher: { "@type": "Organization", name: "Runex Logistics Inc.", logo: { "@type": "ImageObject", url: "https://runexlogi.com/runex-mark.svg" } },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://runexlogi.com" },
        { "@type": "ListItem", position: 2, name: "Insights", item: "https://runexlogi.com/insights" },
        { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
      ],
    },
  ];

  return (
    <main className="article-page">
      <SiteHeader current="Insights" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article>
        <header className="article-hero">
          <Link className="article-back" href="/insights">← All insights</Link>
          <p className="eyebrow"><span /> {article.category}</p>
          <h1>{article.title}</h1>
          <p>{article.description}</p>
          <div><time dateTime={article.publishedAt}>{article.publishedAt}</time><span>{article.readTime}</span><span>Runex Logistics Inc.</span></div>
          <p className="article-review">Prepared and reviewed by the Runex Logistics editorial team for operational clarity.</p>
        </header>
        <div className="article-layout">
          <aside>
            <small>IN THIS GUIDE</small>
            <a href="#key-answer">Quick answer</a>
            {article.sections.map((section, index) => <a href={`#section-${index + 1}`} key={section.heading}>0{index + 1} {section.heading}</a>)}
          </aside>
          <div className="article-body">
            <section className="key-answer" aria-labelledby="key-answer"><small>QUICK ANSWER</small><h2 id="key-answer">What you need to know</h2><p>{article.keyAnswer}</p></section>
            {article.sections.map((section, index) => (
              <section id={`section-${index + 1}`} className="article-section" key={section.heading}>
                <span>0{index + 1}</span><h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
              </section>
            ))}
            <section className="article-faq" id="faq" aria-labelledby="faq-title"><small>FREQUENTLY ASKED QUESTIONS</small><h2 id="faq-title">Common questions</h2>{article.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>

            <section className="article-next-steps" aria-labelledby="next-steps-title">
              <small>USEFUL NEXT STEPS</small>
              <h2 id="next-steps-title">Connect this guidance to your operation</h2>
              {relatedService && (
                <Link className="article-service-link" href={`/solutions/${relatedService.slug}`}>
                  <span>RELATED SERVICE</span>
                  <strong>{relatedService.title}</strong>
                  <Arrow />
                </Link>
              )}
              {relatedArticles.length > 0 && (
                <div className="article-related-links">
                  {relatedArticles.map((item) => (
                    <Link href={`/insights/${item.slug}`} key={item.slug}>
                      <span>{item.category}</span>
                      <strong>{item.title}</strong>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="article-contact"><div><small>NEED HELP WITH YOUR OPERATION?</small><h2>Build the right logistics workflow.</h2><p>Tell Runex what you receive, store, prepare and deliver. We will help map the next step.</p></div><a className="button button-primary" href="mailto:info@runexlogi.com?subject=Runex%20Logistics%20Inquiry">Contact our team <Arrow /></a></section>
          </div>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
