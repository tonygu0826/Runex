import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractPublicationRecords } from "./seo-quality.mjs";

export function hasArticlePublishedOn(source, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error("Publication date must be a valid YYYY-MM-DD date.");
  }
  // Match the site's active-article filter. Modified dates, future examples,
  // evidence and superseded records do not count as a new publication.
  return extractPublicationRecords(source).some((article) => !article.supersededBy && article.publishedAt === date);
}

async function main() {
  const date = process.argv[2];
  const input = process.argv[3] || new URL("../app/insights/articles.ts", import.meta.url);
  let source;
  if (input === "-") {
    process.stdin.setEncoding("utf8");
    source = "";
    for await (const chunk of process.stdin) source += chunk;
  } else {
    source = await readFile(input, "utf8");
  }
  // Keep stdout machine-readable. Read/parse errors exit nonzero, rather than
  // being interpreted by the workflow as permission to publish another article.
  process.stdout.write(`${hasArticlePublishedOn(source, date)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
