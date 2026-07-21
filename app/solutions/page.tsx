import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, SiteFooter, SiteHeader } from "../components/site-chrome";
import { services } from "./services";

export const metadata: Metadata = {
  title: "Warehousing, FBA Prep & Transportation | Runex Logistics",
  description: "Explore three connected Runex solutions for warehousing and fulfillment, FBA and e-commerce preparation, and transportation and cross-docking across Canada.",
  alternates: { canonical: "/solutions" },
};

export default function SolutionsPage() {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Runex Logistics solutions",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: service.title,
        description: service.summary,
        provider: { "@type": "Organization", name: "Runex Logistics Inc.", url: "https://runexlogi.com" },
        areaServed: { "@type": "Country", name: "Canada" },
        url: `https://runexlogi.com/solutions/${service.slug}`,
      },
    })),
  };

  return (
    <main className="interior-page">
      <SiteHeader current="Solutions" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      <section className="page-hero">
        <p className="eyebrow"><span /> Connected logistics services</p>
        <h1>3PL solutions from receiving to delivery.</h1>
        <p>Three focused solutions connect warehousing, marketplace preparation and freight movement without cluttering the way customers navigate the site.</p>
      </section>

      <section className="detail-section" aria-labelledby="solutions-heading">
        <div className="detail-intro">
          <div>
            <p className="eyebrow dark"><span /> What we handle</p>
            <h2 id="solutions-heading">Choose the workflow that matches your freight.</h2>
          </div>
          <p>Each solution has its own detailed page, direct answers and operating considerations. Start with the service you need today and connect more steps as volume changes.</p>
        </div>
        <div className="detail-grid">
          {services.map((service) => (
            <article className="detail-card" key={service.slug}>
              <span>{service.number}</span>
              <h2>{service.shortTitle}</h2>
              <p>{service.summary}</p>
              <ul>{service.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <Link href={`/solutions/${service.slug}`}>Explore {service.shortTitle.toLowerCase()} <Arrow /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-band" aria-labelledby="workflow-heading">
        <div>
          <p className="eyebrow"><span /> How it works</p>
          <h2 id="workflow-heading">A clear plan before the first shipment arrives.</h2>
        </div>
        <ol>
          <li><b>01</b><span><strong>Define</strong>Share your freight profile, volume and handling requirements.</span></li>
          <li><b>02</b><span><strong>Map</strong>Build the receiving, storage, preparation and delivery workflow.</span></li>
          <li><b>03</b><span><strong>Execute</strong>Move each shipment through a documented operating plan.</span></li>
          <li><b>04</b><span><strong>Adjust</strong>Refine capacity and handling as your operation changes.</span></li>
        </ol>
      </section>

      <section className="page-cta">
        <div><small>READY TO PLAN THE WORKFLOW?</small><h2>Tell us what you receive, store, prepare and deliver.</h2></div>
        <Link className="button button-primary" href="/contact">Contact Runex <Arrow /></Link>
      </section>
      <SiteFooter />
    </main>
  );
}
