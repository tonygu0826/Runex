import { articles } from "./articles";
import { releasedThroughDate } from "./publication-time.mjs";

// Public routes must read through these request-time selectors. The raw archive
// also contains reviewed future content for generation and deployment checks.
export function getPublishedArticles(now = new Date()) {
  const cutoff = releasedThroughDate(now);
  return articles.filter((article) => !article.supersededBy && article.publishedAt <= cutoff)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getArticle(slug: string, now = new Date()) {
  const cutoff = releasedThroughDate(now);
  const matched = articles.find((article) => article.publishedAt <= cutoff && (article.slug === slug || article.legacySlugs?.includes(slug)));
  if (!matched?.supersededBy) return matched;
  return articles.find((article) => article.publishedAt <= cutoff && article.slug === matched.supersededBy);
}
