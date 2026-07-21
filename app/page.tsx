import Link from "next/link";
import { Arrow, SiteFooter, SiteHeader } from "./components/site-chrome";
import { articles } from "./insights/articles";

const serviceCards = [
  {
    number: "01",
    title: "Warehousing & 3PL",
    text: "Flexible storage, inventory control, pick and pack, cross-docking and distribution built around your operation.",
    label: "Storage to delivery",
  },
  {
    number: "02",
    title: "FBA & E-commerce",
    text: "FBA preparation, labeling, inspection, returns and fulfillment that keep marketplace orders moving.",
    label: "Marketplace ready",
  },
  {
    number: "03",
    title: "Transportation",
    text: "Reliable pickup, transfer and final-mile coordination with one team keeping every handoff visible.",
    label: "Canada-wide reach",
  },
];

const solutionCards = [
  {
    type: "IMPORTERS & DISTRIBUTORS",
    title: "Keep inbound freight moving",
    text: "Coordinate receiving, pallet handling, short- or long-term storage and onward distribution without adding another handoff.",
  },
  {
    type: "E-COMMERCE BRANDS",
    title: "Prepare every order correctly",
    text: "Handle labeling, FBA prep, pick and pack, returns and replenishment with a workflow designed for marketplace requirements.",
  },
  {
    type: "GROWING OPERATIONS",
    title: "Add capacity without adding complexity",
    text: "Use flexible warehouse space and coordinated transportation while keeping one point of contact across the operation.",
  },
];

export default function Home() {
  return (
    <main id="top">
      <SiteHeader current="Home" />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <p className="eyebrow"><span /> Integrated logistics across Canada</p>
          <h1 id="hero-title">Logistics that keeps business moving.</h1>
          <p className="hero-copy">
            Warehousing, 3PL fulfillment, FBA prep and transportation managed by one responsive logistics team.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/contact">Get a Quote <Arrow /></a>
            <a className="button button-secondary" href="/solutions">Explore Solutions <Arrow /></a>
          </div>
        </div>
        <div className="hero-image" role="img" aria-label="Modern distribution warehouse with forklift and loading dock">
          <div className="image-status">
            <span className="pulse" />
            <div><small>OPERATIONAL STATUS</small><strong>READY TO MOVE</strong></div>
          </div>
        </div>
        <div className="capability-rail" aria-label="Core capabilities">
          <div><b>01</b><span>Warehousing<br />& 3PL</span></div>
          <div><b>02</b><span>FBA Prep<br />& Fulfillment</span></div>
          <div><b>03</b><span>Transportation<br />& Distribution</span></div>
          <p><span>ONE TEAM</span> From dock to destination</p>
        </div>
      </section>

      <section className="services section-shell" id="services" aria-labelledby="services-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark"><span /> What we do</p>
            <h2 id="services-title">A complete logistics operation under one roof.</h2>
          </div>
          <p>Scale capacity up or down without losing control. Runex connects warehousing, order preparation and transportation into one practical workflow.</p>
        </div>
        <div className="service-grid">
          {serviceCards.map((service) => (
            <article className="service-card" key={service.number}>
              <div className="service-meta"><span>{service.number}</span><small>{service.label}</small></div>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <a href="/solutions">View solutions <Arrow /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="solutions section-shell" id="solutions" aria-labelledby="solutions-title">
        <div className="solutions-intro">
          <p className="eyebrow"><span /> Built around your operation</p>
          <h2 id="solutions-title">Practical logistics for the way your business actually runs.</h2>
          <p>Clear ownership, fewer handoffs and a plan that adjusts as volume changes.</p>
        </div>
        <div className="solution-list">
          {solutionCards.map((solution, index) => (
            <article key={solution.type}>
              <span>0{index + 1}</span>
              <div><small>{solution.type}</small><h3>{solution.title}</h3></div>
              <p>{solution.text}</p>
              <a href="/contact" aria-label={`Discuss ${solution.type.toLowerCase()} logistics`}><Arrow /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="operations" aria-labelledby="operations-title">
        <div className="operations-copy">
          <p className="eyebrow"><span /> One connected workflow</p>
          <h2 id="operations-title">From arrival to final delivery, every step has an owner.</h2>
          <p>Runex keeps warehouse work and transportation aligned, so freight does not sit waiting for the next team to take over.</p>
          <a className="button button-primary" href="/contact">Plan your workflow <Arrow /></a>
        </div>
        <div className="process" aria-label="Runex logistics process">
          <div><b>01</b><span /><h3>Receive</h3><p>Confirm arrival and match freight to the operating plan.</p></div>
          <div><b>02</b><span /><h3>Prepare</h3><p>Store, inspect, label, pick or cross-dock as required.</p></div>
          <div><b>03</b><span /><h3>Move</h3><p>Coordinate pickup, transfer and delivery with fewer handoffs.</p></div>
          <div><b>04</b><span /><h3>Confirm</h3><p>Close the loop with clear shipment and delivery updates.</p></div>
        </div>
      </section>

      <section className="about section-shell" id="about" aria-labelledby="about-title">
        <div className="about-panel">
          <div className="about-number">
            <div className="about-logo" aria-label="Runex Logistics Inc.">
              <img src="/runex-mark.svg" alt="" width="112" height="112" />
              <span><strong>RUNEX</strong><b>LOGISTICS INC.</b></span>
            </div>
            <small>RUNEX STANDARD</small>
          </div>
          <div className="about-copy">
            <p className="eyebrow dark"><span /> Why Runex</p>
            <h2 id="about-title">Responsive enough for daily operations. Structured enough for growth.</h2>
            <p>We built Runex around a simple idea: clients should not have to chase different providers to understand what is happening with their freight.</p>
            <div className="principles">
              <div><b>01</b><h3>Clear communication</h3><p>Direct answers and one team responsible for the next step.</p></div>
              <div><b>02</b><h3>Operational flexibility</h3><p>Warehouse and delivery plans that adjust to changing volume.</p></div>
              <div><b>03</b><h3>Reliable execution</h3><p>Practical processes designed to keep work moving.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-insights section-shell" aria-labelledby="home-insights-title">
        <div className="home-insights-heading">
          <div><p className="eyebrow dark"><span /> Insights</p><h2 id="home-insights-title">Logistics answers your team can use.</h2></div>
          <Link href="/insights">View all articles <Arrow /></Link>
        </div>
        <div className="home-article-grid">
          {articles.map((article) => (
            <article key={article.slug}>
              <small>{article.category}</small>
              <h3><a href={`/insights/${article.slug}`}>{article.title}</a></h3>
              <p>{article.excerpt}</p>
              <a href={`/insights/${article.slug}`}>Read article <Arrow /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="contact" id="contact" aria-labelledby="contact-title">
        <div>
          <p className="eyebrow"><span /> Start a conversation</p>
          <h2 id="contact-title">Tell us what needs to move.</h2>
          <p>Share your storage, fulfillment or transportation requirements. We will help you map the next step.</p>
        </div>
        <a className="contact-link" href="mailto:tony@fengyecang.com?subject=Runex%20Logistics%20Quote%20Request">
          <span><small>EMAIL OUR TEAM</small><strong>tony@fengyecang.com</strong></span>
          <i><Arrow /></i>
        </a>
      </section>

      <SiteFooter />
    </main>
  );
}
