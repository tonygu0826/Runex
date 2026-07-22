import { articles } from "../insights/articles";
import { services } from "../solutions/services";

const baseUrl = "https://runexlogi.com";
const coreTopics = [
  "Canadian 3PL warehousing",
  "warehouse fulfillment Canada",
  "FBA prep Canada",
  "e-commerce fulfillment",
  "inventory control",
  "cross-docking Canada",
  "transportation coordination",
  "value-added warehouse services",
];

export function GET() {
  const recentArticles = articles.slice(0, 12);
  const topicPhrases = [
    ...coreTopics,
    ...recentArticles.flatMap((article) => article.keywords ?? [article.title]),
  ];
  const uniqueTopics = [...new Set(topicPhrases.map((topic) => topic.trim()).filter(Boolean))].slice(0, 24);

  const body = [
    "# Runex Logistics Inc.",
    "",
    "> Canadian 3PL warehousing, fulfillment, FBA and e-commerce preparation, cross-docking, inventory control and transportation coordination.",
    "",
    `Canonical site: ${baseUrl}`,
    "Primary market: Canada",
    "Contact: info@runexlogi.com",
    "",
    "## Core service pages",
    ...services.map(
      (service) =>
        `- [${service.title}](${baseUrl}/solutions/${service.slug}): ${service.description}`,
    ),
    "",
    "## Current knowledge topics",
    ...recentArticles.map(
      (article) =>
        `- [${article.title}](${baseUrl}/insights/${article.slug}): ${article.description}`,
    ),
    "",
    "## Current topic phrases",
    ...uniqueTopics.map((topic) => `- ${topic}`),
    "",
    "## Important pages",
    `- [About Runex](${baseUrl}/about)`,
    `- [Insights](${baseUrl}/insights)`,
    `- [Contact](${baseUrl}/contact)`,
    "",
    "This file is generated from current website content and updates whenever a new article is published.",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
