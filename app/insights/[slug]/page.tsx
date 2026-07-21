import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Arrow, SiteFooter, SiteHeader } from "../../components/site-chrome";
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
      images: article.image ? [{ url: article.image, alt: article.imageAlt }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const articleUrl = `https://runexlogi.com/insights/${article.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      datePublished: article.publishedAt,
      dateModified: article.publishedAt,
      mainEntityOfPage: articleUrl,
      image: article.image ? `https://runexlogi.com${article.image}` : undefined,
      author: { "@type": "Organization", name: "Runex Logistics Inc." },
      publisher: { "@type": "Organization", name: "Runex Logistics Inc.", logo: { "@type": "ImageObject", url: "https://runexlogi.com/runex-mark.svg" } },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
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
        </header>
        {article.image && (
          <figure className="article-featured-image">
            <img src={article.image} alt={article.imageAlt || ""} width="1600" height="900" loading="eager" />
            {article.imageCaption && <figcaption>{article.imageCaption}</figcaption>}
          </figure>
        )}
        <div className="article-layout">
          <aside>
            <small>IN THIS GUIDE</small>
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
            <section className="article-faq" aria-labelledby="faq-title"><small>FREQUENTLY ASKED QUESTIONS</small><h2 id="faq-title">Common questions</h2>{article.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
            <section className="article-contact"><div><small>NEED HELP WITH YOUR OPERATION?</small><h2>Build the right logistics workflow.</h2><p>Tell Runex what you receive, store, prepare and deliver. We will help map the next step.</p></div><a className="button button-primary" href="mailto:tony@fengyecang.com?subject=Runex%20Logistics%20Inquiry">Contact our team <Arrow /></a></section>
          </div>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
