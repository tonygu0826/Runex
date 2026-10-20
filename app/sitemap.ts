import type { MetadataRoute } from "next";
import { getPublishedArticles } from "./insights/publications";
import { services } from "./solutions/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const baseUrl = "https://runexlogi.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const publishedArticles = getPublishedArticles();
  const siteUpdated = new Date("2026-08-08");
  return [
    { url: baseUrl, lastModified: siteUpdated },
    { url: `${baseUrl}/solutions`, lastModified: siteUpdated },
    ...services.map((service) => ({ url: `${baseUrl}/solutions/${service.slug}`, lastModified: siteUpdated })),
    { url: `${baseUrl}/about`, lastModified: siteUpdated },
    { url: `${baseUrl}/insights`, lastModified: new Date(publishedArticles[0]?.publishedAt ?? siteUpdated) },
    { url: `${baseUrl}/contact`, lastModified: siteUpdated },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date("2026-10-08") },
    ...publishedArticles
      .filter((article) => article.qualityGatePassed)
      .map((article) => ({ url: `${baseUrl}/insights/${article.slug}`, lastModified: new Date(article.modifiedAt ?? article.publishedAt) })),
  ];
}
