import type { Metadata } from "next";
import { Arrow, SiteFooter, SiteHeader } from "../components/site-chrome";

export const metadata: Metadata = {
  title: "Contact Runex Logistics | Request a Logistics Quote",
  description: "Contact Runex Logistics about warehousing, FBA preparation, e-commerce fulfillment, cross-docking or transportation requirements in Canada.",
  alternates: { canonical: "/contact" },
};

const briefItems = [
  "What products or freight do you handle?",
  "How does inventory arrive: pallets, cartons or containers?",
  "What storage, preparation or fulfillment work is required?",
  "Where and how often does freight need to move?",
  "What volume, timing or special handling should we plan for?",
];

export default function ContactPage() {
  return (
    <main className="interior-page contact-page">
      <SiteHeader current="Contact" />

      <section className="page-hero contact-hero">
        <p className="eyebrow"><span /> Contact Runex</p>
        <h1>Tell us what needs to move.</h1>
        <p>Share your warehousing, fulfillment or transportation requirements and we will help map the next practical step.</p>
      </section>

      <section className="contact-main" aria-labelledby="contact-heading">
        <div className="contact-direct">
          <p className="eyebrow dark"><span /> Start a conversation</p>
          <h2 id="contact-heading">Send the operating details to our team.</h2>
          <p>The more we understand about the inbound freight, required warehouse work and outbound plan, the more useful our first response can be.</p>
          <a className="contact-link light" href="mailto:tony@fengyecang.com?subject=Runex%20Logistics%20Quote%20Request">
            <span><small>EMAIL OUR TEAM</small><strong>tony@fengyecang.com</strong></span>
            <i><Arrow /></i>
          </a>
        </div>
        <aside className="project-brief">
          <small>WHAT TO INCLUDE</small>
          <h2>A useful project brief</h2>
          <ul>{briefItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </aside>
      </section>

      <section className="response-band">
        <div><b>01</b><span><strong>You share the requirement</strong>Describe the freight, volume, workflow and timing.</span></div>
        <div><b>02</b><span><strong>We clarify the operation</strong>Identify handling details, exceptions and delivery needs.</span></div>
        <div><b>03</b><span><strong>We map the next step</strong>Build a practical service plan around the requirement.</span></div>
      </section>

      <SiteFooter />
    </main>
  );
}
