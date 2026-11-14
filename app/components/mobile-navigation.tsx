"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Item = { label: string; href: string };

export function MobileNavigation({ navigation, current }: { navigation: readonly Item[]; current?: string }) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  useEffect(() => { if (disclosure.current) disclosure.current.open = false; }, [pathname]);
  useEffect(() => {
    function dismiss(event: KeyboardEvent | PointerEvent) {
      const menu = disclosure.current;
      if (!menu?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        menu.open = false;
        menu.querySelector("summary")?.focus();
      } else if (!menu.contains(event.target as Node)) menu.open = false;
    }
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", dismiss);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, []);
  return (
    <details ref={disclosure} className="mobile-menu">
      <summary aria-label="Toggle navigation">Menu <span aria-hidden="true">☰</span></summary>
      <nav aria-label="Mobile primary navigation">
        {navigation.map((item) => (
          <Link key={item.href} href={item.href} aria-current={current === item.label ? "page" : undefined}
            onClick={() => { if (disclosure.current) disclosure.current.open = false; }}>
            {item.label}
          </Link>
        ))}
        <Link className="mobile-quote" href="/contact" onClick={() => { if (disclosure.current) disclosure.current.open = false; }}>Get a Quote</Link>
      </nav>
    </details>
  );
}
