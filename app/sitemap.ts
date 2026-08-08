import type { MetadataRoute } from "next";
import { articles } from "./insights/articles";
import { services } from "./solutions/services";

const baseUrl = "https://runexlogi.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUpdated = new Date("2026-08-08");
  return [
    { url: baseUrl, lastModified: siteUpdated },
    { url: `${baseUrl}/solutions`, lastModified: siteUpdated },
    ...services.map((service) => ({ url: `${baseUrl}/solutions/${service.slug}`, lastModified: siteUpdated })),
    { url: `${baseUrl}/about`, lastModified: siteUpdated },
    { url: `${baseUrl}/insights`, lastModified: new Date(articles[0]?.publishedAt ?? siteUpdated) },
    { url: `${baseUrl}/contact`, lastModified: siteUpdated },
    ...articles
      .filter((article) => article.qualityGatePassed)
      .map((article) => ({ url: `${baseUrl}/insights/${article.slug}`, lastModified: new Date(article.modifiedAt ?? article.publishedAt) })),
  ];
}
