import { readFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractPublicationRecords } from "./seo-quality.mjs";
import { publicationDate, addPublicationDays, releasedThroughDate, validPublicationDate } from "../app/insights/publication-time.mjs";

export function publicationQueue(source, { now = new Date(), runDate = publicationDate(now) } = {}) {
  if (!validPublicationDate(runDate)) throw new Error("Invalid publication run date.");
  const records = extractPublicationRecords(source).filter((article) => !article.supersededBy);
  const dates = new Set();
  for (const record of records) {
    if (!validPublicationDate(record.publishedAt) || dates.has(record.publishedAt)) throw new Error(`Invalid or duplicate active publication date: ${record.publishedAt}`);
    dates.add(record.publishedAt);
  }
  const upcoming = [addPublicationDays(runDate, 1), addPublicationDays(runDate, 2)];
  const missing = [runDate, ...upcoming].filter((date) => !dates.has(date));
  return { runDate, liveDate: releasedThroughDate(now), upcoming, missing };
}

export async function preparePublicationQueue({ env = process.env, now = Date.now, readSource = readFile, generate, logger = console } = {}) {
  const articlesPath = env.ARTICLES_PATH || new URL("../app/insights/articles.ts", import.meta.url);
  const runDate = env.PUBLICATION_RUN_DATE || publicationDate(now());
  const source = await readSource(articlesPath, "utf8");
  const plan = publicationQueue(source, { now: now(), runDate });
  const prepared = [];
  let failure;
  // At most two full bounded generation budgets. Routine replenishment needs
  // one article; a merge/bootstrap or recovery may restore both reserve slots.
  for (const date of plan.missing.slice(0, 2)) {
    try {
      const write = generate || (await import("./generate-seo-article.mjs")).generateSeoArticle;
      await write({ env: { ...env, ARTICLES_PATH: String(articlesPath instanceof URL ? fileURLToPath(articlesPath) : articlesPath), PUBLICATION_DATE: date, ARTICLE_TOPIC: prepared.length ? "" : env.ARTICLE_TOPIC } });
      const after = publicationQueue(await readSource(articlesPath, "utf8"), { now: now(), runDate });
      if (after.missing.includes(date)) throw new Error(`Generator produced no article for ${date}.`);
      prepared.push(date);
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
      logger.warn(`::warning::Queue preparation stopped: ${failure}`);
      // Keep any earlier validated draft. Build/commit it, then let final live
      // verification fail if a required day is still missing. No false success.
      break;
    }
  }
  return { ...plan, prepared, failure };
}

async function main() {
  const source = await readFile(process.env.ARTICLES_PATH || new URL("../app/insights/articles.ts", import.meta.url), "utf8");
  const plan = publicationQueue(source, { runDate: process.env.PUBLICATION_RUN_DATE || undefined });
  if (process.argv.includes("--plan")) {
    console.log(JSON.stringify(plan));
    if (process.env.GITHUB_ENV) await appendFile(process.env.GITHUB_ENV, `PUBLICATION_RUN_DATE=${plan.runDate}\n`);
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `should_publish=${plan.missing.length > 0}\n`);
    return;
  }
  if (process.argv.includes("--verify")) {
    if (plan.missing.length) throw new Error(`Publication reserve incomplete; missing ${plan.missing.join(", ")}.`);
    const { verifyLivePublication } = await import("./verify-seo-live.mjs");
    // One shared five-minute propagation allowance for current and queued pages.
    const deadline = Date.now() + 300_000;
    const results = await Promise.all([plan.liveDate, ...plan.upcoming].map((date) => verifyLivePublication({
      source, date, maxWaitMs: Math.max(1, deadline - Date.now()),
    })));
    console.log(JSON.stringify({ status: "ready", runDate: plan.runDate, results }));
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `\nLive publication verified through ${plan.liveDate}. Deployed reserve ready for ${plan.upcoming.join(", ")}; release is 09:00 America/Toronto.\n`);
    return;
  }
  const result = await preparePublicationQueue();
  console.log(JSON.stringify(result));
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `prepared=${result.prepared.length}\nprepared_dates=${result.prepared.join(",")}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
