import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://runex-logistics.tony0826.chatgpt.site"),
  title: "Runex Logistics Inc. | Warehousing, Fulfillment & Transportation",
  description: "Runex Logistics provides warehousing, 3PL fulfillment, FBA preparation and transportation services across Canada.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Runex Logistics Inc.",
    description: "Warehousing, 3PL fulfillment, FBA preparation and transportation across Canada.",
    siteName: "Runex Logistics Inc.",
  },
  other: {
    "codex-preview": "development",
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
    name: "Runex Logistics Inc.",
    url: "https://runex-logistics.tony0826.chatgpt.site",
    logo: "https://runex-logistics.tony0826.chatgpt.site/runex-mark.svg",
    email: "tony@fengyecang.com",
    areaServed: "Canada",
  };
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${nunitoSans.variable} antialiased`}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
