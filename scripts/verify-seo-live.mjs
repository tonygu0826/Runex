import { readFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { extractExistingArticleSignals, extractPublicationRecords } from "./seo-quality.mjs";
import { hasArticlePublishedOn } from "./check-seo-publication.mjs";

export function publicationTarget(source, date) {
  if (!hasArticlePublishedOn(source, date)) throw new Error(`No active article was committed for ${date}.`);
  const records = extractPublicationRecords(source).filter((item) => !item.supersededBy && item.publishedAt === date);
  if (records.length !== 1) throw new Error(`Expected one active article for ${date}; found ${records.length}.`);
  const target = extractExistingArticleSignals(source).find((item) => item.slug === records[0].slug);
  if (!target) throw new Error("Published article metadata could not be read.");
  return { ...target, publishedAt: date };
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] || "";
}

function structuredArticles(html) {
  const all = [];
  const visit = (node) => {
    if (Array.isArray(node)) node.forEach(visit);
    else if (node && typeof node === "object") {
      if (node["@type"] === "Article" || node["@type"] === "BlogPosting") all.push(node);
      if (node["@graph"]) visit(node["@graph"]);
    }
  };
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attribute(match[1], "type") === "application/ld+json") visit(JSON.parse(match[2]));
  }
  return all;
}

export function assertLiveArticle(html, target, url) {
  const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].find((match) => attribute(match[0], "rel") === "canonical");
  if (!canonical || attribute(canonical[0], "href") !== url) throw new Error(`Article canonical does not match ${url}.`);
  const data = structuredArticles(html).find((item) => (typeof item.mainEntityOfPage === "string" ? item.mainEntityOfPage : item.mainEntityOfPage?.["@id"]) === url);
  if (!data || data.headline !== target.title || data.datePublished?.slice(0, 10) !== target.publishedAt) {
    throw new Error(`Live article title/date does not match the committed article for ${target.publishedAt}.`);
  }
  const robots = [...html.matchAll(/<meta\b[^>]*>/gi)].find((match) => attribute(match[0], "name") === "robots");
  if (robots && /\bnoindex\b/i.test(attribute(robots[0], "content"))) throw new Error("Live article unexpectedly disallows indexing.");
}

export async function checkLivePublication({ target, origin = "https://runexlogi.com", request = fetch, timeoutMs = 10_000 }) {
  const base = new URL(origin);
  if (base.protocol !== "https:" || base.pathname !== "/" || base.search || base.username || base.password) throw new Error("Live verification requires a plain HTTPS origin.");
  const articleUrl = new URL(`/insights/${target.slug}`, base).href;
  const urls = [articleUrl, new URL("/insights", base).href, new URL("/sitemap.xml", base).href, base.href, new URL("/contact", base).href];
  const responses = await Promise.all(urls.map(async (url) => {
    const response = await request(url, { signal: AbortSignal.timeout(timeoutMs), headers: { "Cache-Control": "no-cache" }, redirect: "error" });
    if (response.status !== 200) throw new Error(`${url} returned HTTP ${response.status}.`);
    return response.text(); // The same abort signal also bounds body reads.
  }));
  assertLiveArticle(responses[0], target, articleUrl);
  const listingLinks = [...responses[1].matchAll(/<a\b[^>]*>/gi)].map((match) => attribute(match[0], "href"));
  if (!listingLinks.some((href) => new URL(href, base).href === articleUrl)) throw new Error("The Insights listing does not link to the committed article.");
  if (!responses[2].includes(`<loc>${articleUrl}</loc>`)) throw new Error("The sitemap does not contain the committed article.");
  if (!/<html\b/i.test(responses[3]) || !/<form\b/i.test(responses[4])) throw new Error("Homepage or contact page did not render its expected content.");
  return { url: articleUrl, publishedAt: target.publishedAt };
}

export async function verifyLivePublication({ source, date, maxWaitMs = 300_000, now = Date.now, wait = delay, logger = console, ...options }) {
  const target = publicationTarget(source, date);
  const budget = Math.min(300_000, Math.max(1, maxWaitMs));
  const deadline = now() + budget;
  let lastError;
  do {
    try {
      return await checkLivePublication({ ...options, target, timeoutMs: Math.min(10_000, Math.max(1, deadline - now())) });
    } catch (error) {
      lastError = error;
      const remaining = deadline - now();
      if (remaining <= 0) break;
      logger.warn(`Waiting for the live deployment: ${error.message}`);
      await wait(Math.min(15_000, remaining));
    }
  } while (now() < deadline);
  throw new Error(`Committed article did not become fully live within ${budget} ms: ${lastError?.message}`);
}

async function main() {
  const source = await readFile(process.env.ARTICLES_PATH || new URL("../app/insights/articles.ts", import.meta.url), "utf8");
  const result = await verifyLivePublication({ source, date: process.argv[2] });
  console.log(`Verified live publication: ${result.url} (${result.publishedAt}); listing, sitemap, homepage and contact page are available.`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `\nVerified live: [article](${result.url}) — ${result.publishedAt}. Listing, sitemap, homepage and contact form rendered successfully.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
