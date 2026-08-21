import type { Metadata } from "next";
import "./globals.css";

const openAIAdsPixelId = "9MPjBuNd4aM4F6unct8oQ8";

const openAIAdsBootstrap = `
(function (w, d, s, u) {
  if (w.oaiq) return;
  var q = function () {
    q.q.push(arguments);
  };
  q.q = [];
  w.oaiq = q;
  var js = d.createElement(s);
  js.async = true;
  js.src = u;
  var f = d.getElementsByTagName(s)[0];
  f.parentNode.insertBefore(js, f);
})(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");

oaiq("init", {
  pixelId: ${JSON.stringify(openAIAdsPixelId)},
});
`;

export const metadata: Metadata = {
  metadataBase: new URL("https://runexlogi.com"),
  title: "Runex Logistics Inc. | Warehousing, Fulfillment & Transportation",
  description: "Runex Logistics provides warehousing, 3PL fulfillment, FBA preparation and transportation services across Canada.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Runex Logistics Inc.",
    description: "Warehousing, 3PL fulfillment, FBA preparation and transportation across Canada.",
    siteName: "Runex Logistics Inc.",
  },
  icons: {
    icon: "/runex-mark.svg",
    shortcut: "/runex-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://runexlogi.com/#organization",
    name: "Runex Logistics Inc.",
    legalName: "Runex Logistics Inc.",
    url: "https://runexlogi.com",
    logo: "https://runexlogi.com/runex-mark.svg",
    email: "info@runexlogi.com",
    areaServed: "Canada",
    description: "Canadian warehousing, fulfillment, FBA preparation and transportation services.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales and operations inquiries",
      email: "info@runexlogi.com",
      areaServed: "CA",
      availableLanguage: "English",
    },
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://runexlogi.com/#website",
    url: "https://runexlogi.com",
    name: "Runex Logistics Inc.",
    alternateName: "Runex Logistics",
    publisher: { "@id": "https://runexlogi.com/#organization" },
  };
  return (
    <html lang="en">
      <head>
        <script
          data-openai-ads-pixel={openAIAdsPixelId}
          dangerouslySetInnerHTML={{ __html: openAIAdsBootstrap }}
        />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationJsonLd, websiteJsonLd]) }} />
        {children}
      </body>
    </html>
  );
}
