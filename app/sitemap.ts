import type { MetadataRoute } from "next";
import { articles } from "./insights/articles";

const baseUrl = "https://runexlogi.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, lastModified: new Date("2026-07-20"), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/solutions`, lastModified: new Date("2026-07-21"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date("2026-07-21"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/insights`, lastModified: new Date("2026-07-20"), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: new Date("2026-07-21"), changeFrequency: "monthly", priority: 0.8 },
    ...articles.map((article) => ({ url: `${baseUrl}/insights/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
