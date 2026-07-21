import Link from "next/link";

export const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20">
    <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>
);

export const Logo = () => (
  <Link className="brand" href="/" aria-label="Runex Logistics home">
    <img src="/runex-mark.svg" alt="" width="48" height="48" />
    <span className="brand-copy">
      <strong>RUNEX</strong>
      <small>LOGISTICS INC.</small>
    </span>
  </Link>
);

const navigation = [
  { label: "Home", href: "/" },
  { label: "Solutions", href: "/solutions" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
  { label: "Contact", href: "/contact" },
] as const;

type NavigationLabel = (typeof navigation)[number]["label"];

export function SiteHeader({ current }: { current?: NavigationLabel }) {
  return (
    <header className="site-header">
      <Logo />
      <nav aria-label="Primary navigation">
        {navigation.map((item) => (
          <Link href={item.href} aria-current={current === item.label ? "page" : undefined} key={item.label}>
            {item.label}
          </Link>
        ))}
      </nav>
      <Link className="button button-primary header-cta" href="/contact">
        Get a Quote <Arrow />
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <Logo />
      <p>Warehousing, fulfillment and transportation across Canada.</p>
      <div>
        {navigation.map((item) => <Link href={item.href} key={item.label}>{item.label}</Link>)}
      </div>
      <small>© 2026 Runex Logistics Inc.</small>
    </footer>
  );
}
