import type { Metadata } from "next";
import { Arrow, SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = {
  title: "3PL Warehousing, FBA Prep & Transportation | Runex Logistics",
  description: "Explore Runex Logistics solutions for 3PL warehousing, FBA preparation, e-commerce fulfillment, cross-docking and transportation across Canada.",
  alternates: { canonical: "/solutions" },
};

const services = [
  {
    id: "warehousing",
    number: "01",
    title: "3PL warehousing",
    summary: "Flexible warehouse support for businesses that need reliable receiving, storage and outbound execution.",
    items: ["Inbound receiving", "Pallet and inventory storage", "Inventory control", "Pick and pack", "Outbound staging"],
  },
  {
    id: "fba-prep",
    number: "02",
    title: "FBA & e-commerce fulfillment",
    summary: "A practical workflow for marketplace inventory, from inbound checks through preparation and dispatch.",
    items: ["Inspection and labeling", "Repacking and carton preparation", "Order fulfillment", "Returns processing", "Replenishment coordination"],
  },
  {
    id: "cross-docking",
    number: "03",
    title: "Cross-docking",
    summary: "Move planned freight through the warehouse with less storage time and a clear outbound handoff.",
    items: ["Inbound unloading", "Sorting and consolidation", "Pallet handling", "Short-term staging", "Outbound loading"],
  },
  {
    id: "transportation",
    number: "04",
    title: "Transportation coordination",
    summary: "Keep pickups, transfers and deliveries connected to the warehouse plan through one responsive team.",
    items: ["Pickup coordination", "Warehouse transfers", "Distribution support", "Delivery scheduling", "Status communication"],
  },
  {
    id: "value-added",
    number: "05",
    title: "Value-added warehouse services",
    summary: "Complete the work freight needs before it can move to a marketplace, retailer or customer.",
    items: ["Product inspection", "Labeling and relabeling", "Kitting", "Repacking", "Pallet preparation"],
  },
  {
    id: "returns",
    number: "06",
    title: "Returns & exception handling",
    summary: "Create a defined process for returned, damaged or non-compliant inventory instead of letting exceptions stall the operation.",
    items: ["Return receiving", "Condition checks", "Exception reporting", "Restock preparation", "Disposition coordination"],
  },
];

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
        areaServed: "Canada",
        url: `https://runexlogi.com/solutions#${service.id}`,
      },
    })),
  };

  return (
    <main className="interior-page">
      <SiteHeader current="Solutions" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      <section className="page-hero">
        <p className="eyebrow"><span /> Connected logistics services</p>
        <h1>One operation from receiving to delivery.</h1>
        <p>Runex connects warehousing, inventory preparation and transportation so every handoff has a clear owner.</p>
      </section>

      <section className="detail-section" aria-labelledby="solutions-heading">
        <div className="detail-intro">
          <div>
            <p className="eyebrow dark"><span /> What we handle</p>
            <h2 id="solutions-heading">3PL solutions built around the freight you actually move.</h2>
          </div>
          <p>Choose the services you need today and add capacity as volume changes. Each workflow is planned around your inventory, handling requirements and outbound schedule.</p>
        </div>
        <div className="detail-grid">
          {services.map((service) => (
            <article className="detail-card" id={service.id} key={service.id}>
              <span>{service.number}</span>
              <h2>{service.title}</h2>
              <p>{service.summary}</p>
              <ul>{service.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <a href="/contact">Discuss this solution <Arrow /></a>
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
        <a className="button button-primary" href="/contact">Contact Runex <Arrow /></a>
      </section>
      <SiteFooter />
    </main>
  );
}
