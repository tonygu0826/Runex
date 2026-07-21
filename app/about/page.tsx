import type { Metadata } from "next";
import { Arrow, SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = {
  title: "About Runex Logistics | Canadian 3PL Operations",
  description: "Learn how Runex Logistics connects warehousing, fulfillment and transportation with clear ownership, responsive communication and flexible execution.",
  alternates: { canonical: "/about" },
};

const principles = [
  { number: "01", title: "Clear ownership", text: "One responsive team keeps the warehouse plan and transportation handoffs aligned." },
  { number: "02", title: "Practical flexibility", text: "Capacity and handling workflows adjust as inventory, volume and priorities change." },
  { number: "03", title: "Visible execution", text: "Receiving, preparation and outbound work follow an agreed operating plan." },
];

export default function AboutPage() {
  return (
    <main className="interior-page">
      <SiteHeader current="About" />

      <section className="page-hero page-hero-about">
        <p className="eyebrow"><span /> About Runex Logistics</p>
        <h1>Logistics built around operational clarity.</h1>
        <p>Runex helps Canadian businesses coordinate warehousing, fulfillment and transportation without adding unnecessary handoffs.</p>
      </section>

      <section className="story-section" aria-labelledby="story-heading">
        <div className="story-mark">
          <img src="/runex-mark.svg" alt="" width="132" height="132" />
          <strong>RUNEX</strong>
          <small>LOGISTICS INC.</small>
        </div>
        <div className="story-copy">
          <p className="eyebrow dark"><span /> Our approach</p>
          <h2 id="story-heading">The next step should never be unclear.</h2>
          <p>Warehouse work and transportation often involve different providers, different updates and different priorities. Runex brings those steps into one coordinated workflow so clients have a clear point of contact from receiving through delivery.</p>
          <p>Our role is practical: understand the freight, document what must happen, communicate exceptions and keep the operation moving as requirements change.</p>
        </div>
      </section>

      <section className="values-section" aria-labelledby="values-heading">
        <div className="values-heading">
          <p className="eyebrow"><span /> The Runex standard</p>
          <h2 id="values-heading">What clients can expect from the operation.</h2>
        </div>
        <div className="values-grid">
          {principles.map((principle) => (
            <article key={principle.number}>
              <span>{principle.number}</span>
              <h3>{principle.title}</h3>
              <p>{principle.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-capabilities">
        <div><small>WAREHOUSING</small><strong>Receive, store and prepare inventory</strong></div>
        <div><small>FULFILLMENT</small><strong>Complete marketplace and order workflows</strong></div>
        <div><small>TRANSPORTATION</small><strong>Coordinate the next freight handoff</strong></div>
      </section>

      <section className="page-cta">
        <div><small>WORK WITH RUNEX</small><h2>Build a logistics plan that fits your operation.</h2></div>
        <a className="button button-primary" href="/contact">Start a conversation <Arrow /></a>
      </section>
      <SiteFooter />
    </main>
  );
}
