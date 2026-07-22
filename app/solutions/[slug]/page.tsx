import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Arrow, SiteFooter, SiteHeader } from "../../components/site-chrome";
import { articles } from "../../insights/articles";
import { getService, services } from "../services";

type PageProps = { params: Promise<{ slug: string }> };

const siteUrl = "https://runexlogi.com";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  return {
    title: service.metaTitle,
    description: service.description,
    alternates: { canonical: `/solutions/${service.slug}` },
    openGraph: {
      type: "website",
      title: service.metaTitle,
      description: service.description,
      url: `${siteUrl}/solutions/${service.slug}`,
    },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const serviceUrl = `${siteUrl}/solutions/${service.slug}`;
  const relatedServices = services.filter((item) => item.slug !== service.slug);
  const categoryMap: Record<string, string[]> = {
    "warehousing-fulfillment-canada": ["3PL & Warehousing", "Fulfillment"],
    "fba-ecommerce-prep-canada": ["FBA & E-commerce", "Fulfillment"],
    "transportation-cross-docking-canada": ["Distribution", "Supply Chain"],
  };
  const relatedInsights = articles
    .filter((article) => categoryMap[service.slug]?.includes(article.category))
    .slice(0, 3);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.title,
      description: service.description,
      serviceType: service.shortTitle,
      url: serviceUrl,
      areaServed: { "@type": "Country", name: "Canada" },
      provider: {
        "@type": "Organization",
        name: "Runex Logistics Inc.",
        url: siteUrl,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: service.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Solutions", item: `${siteUrl}/solutions` },
        { "@type": "ListItem", position: 3, name: service.shortTitle, item: serviceUrl },
      ],
    },
  ];

  return (
    <main className="interior-page service-page">
      <SiteHeader current="Solutions" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-hero service-page-hero">
        <p className="eyebrow"><span /> Canadian logistics solutions</p>
        <h1>{service.title}</h1>
        <p>{service.summary}</p>
        <div className="service-tags" aria-label="Core service capabilities">
          {service.items.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><Link href="/solutions">Solutions</Link><span>/</span><strong>{service.shortTitle}</strong>
      </nav>

      <section className="service-content" aria-label={`${service.shortTitle} details`}>
        <aside className="service-side-nav">
          <small>ON THIS PAGE</small>
          <a href="#quick-answer">Quick answer</a>
          <a href="#quote-preparation">Quote preparation</a>
          {service.sections.map((section, index) => <a href={`#section-${index + 1}`} key={section.heading}>0{index + 1} {section.heading}</a>)}
          <a href="#faq">Common questions</a>
          {relatedInsights.length > 0 && <a href="#operational-insights">Related insights</a>}
          <Link className="side-cta" href="/contact">Discuss your operation <Arrow /></Link>
        </aside>

        <div className="service-main">
          <section className="service-answer" id="quick-answer" aria-labelledby="quick-answer-title">
            <small>QUICK ANSWER</small>
            <h2 id="quick-answer-title">What this service covers</h2>
            <p>{service.keyAnswer}</p>
          </section>

          <section className="service-fit" aria-labelledby="service-fit-title">
            <div>
              <p className="eyebrow dark"><span /> Operational fit</p>
              <h2 id="service-fit-title">A practical fit for</h2>
            </div>
            <ul>{service.idealFor.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section className="service-quote-prep" id="quote-preparation" aria-labelledby="quote-preparation-title">
            <small>BEFORE REQUESTING A QUOTE</small>
            <h2 id="quote-preparation-title">Information that makes the plan more useful</h2>
            <p>A useful operating plan starts with the freight profile, expected activity and known exceptions. Exact requirements can be confirmed after the first conversation.</p>
            <ul>{service.planningInputs.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          {service.sections.map((section, index) => (
            <section className="service-section" id={`section-${index + 1}`} key={section.heading}>
              <span>0{index + 1}</span>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
            </section>
          ))}

          <section className="article-faq service-faq" id="faq" aria-labelledby="faq-title">
            <small>FREQUENTLY ASKED QUESTIONS</small>
            <h2 id="faq-title">Common questions about {service.shortTitle.toLowerCase()}</h2>
            {service.faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>

          {relatedInsights.length > 0 && (
            <section className="service-insights" id="operational-insights" aria-labelledby="operational-insights-title">
              <small>RELATED OPERATIONAL INSIGHTS</small>
              <h2 id="operational-insights-title">Continue researching this workflow</h2>
              <div>
                {relatedInsights.map((article) => (
                  <Link href={`/insights/${article.slug}`} key={article.slug}>
                    <span>{article.category}</span>
                    <strong>{article.title}</strong>
                    <Arrow />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      <section className="related-services" aria-labelledby="related-services-title">
        <div className="related-services-heading">
          <p className="eyebrow"><span /> Connected services</p>
          <h2 id="related-services-title">Build the rest of the workflow.</h2>
        </div>
        <div>
          {relatedServices.map((item) => (
            <Link href={`/solutions/${item.slug}`} key={item.slug}>
              <small>{item.number}</small><strong>{item.shortTitle}</strong><Arrow />
            </Link>
          ))}
        </div>
      </section>

      <section className="page-cta">
        <div><small>READY TO PLAN THE WORKFLOW?</small><h2>Tell us what you receive, store, prepare and deliver.</h2></div>
        <Link className="button button-primary" href="/contact">Contact Runex <Arrow /></Link>
      </section>
      <SiteFooter />
    </main>
  );
}
