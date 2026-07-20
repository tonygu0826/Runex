import type { MetadataRoute } from "next";
import { articles } from "./insights/articles";

const baseUrl = "https://www.runexlogi.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, lastModified: new Date("2026-07-20"), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/insights`, lastModified: new Date("2026-07-20"), changeFrequency: "weekly", priority: 0.9 },
    ...articles.map((article) => ({ url: `${baseUrl}/insights/${article.slug}`, lastModified: new Date(article.publishedAt), changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
