export const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20">
    <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>
);

export const Logo = () => (
  <a className="brand" href="/" aria-label="Runex Logistics home">
    <img src="/runex-mark.svg" alt="" width="48" height="48" />
    <span className="brand-copy">
      <strong>RUNEX</strong>
      <small>LOGISTICS INC.</small>
    </span>
  </a>
);

export function SiteHeader() {
  return (
    <header className="site-header">
      <Logo />
      <nav aria-label="Primary navigation">
        <a href="/#services">Services</a>
        <a href="/#solutions">Solutions</a>
        <a href="/#about">About</a>
        <a href="/insights">Insights</a>
        <a href="/#contact">Contact</a>
      </nav>
      <a className="button button-primary header-cta" href="/#contact">
        Get a Quote <Arrow />
      </a>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <Logo />
      <p>Warehousing, fulfillment and transportation across Canada.</p>
      <div>
        <a href="/#services">Services</a>
        <a href="/#solutions">Solutions</a>
        <a href="/#about">About</a>
        <a href="/insights">Insights</a>
        <a href="/#contact">Contact</a>
      </div>
      <small>© 2026 Runex Logistics Inc.</small>
    </footer>
  );
}
