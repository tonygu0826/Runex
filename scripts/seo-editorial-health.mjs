import { readFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { editorialBriefs } from "./seo-editorial-briefs.mjs";
import autoPool from "./seo-auto-briefs.json" with { type: "json" };
import { extractExistingArticleSignals, extractPublicationRecords, normalizeWords } from "./seo-quality.mjs";
import { unusedEditorialBriefs } from "./seo-topic-planner.mjs";

export const REPLENISH_AT = 30;
const marker = "<!-- runex-seo-editorial-capacity:v1 -->";

export function capacityLevel(remaining) {
  if (remaining === 0) return "depleted";
  if (remaining <= 7) return "critical";
  if (remaining <= 14) return "urgent";
  return remaining <= REPLENISH_AT ? "replenish" : "healthy";
}

export function inspectEditorialPool(source, briefs = editorialBriefs) {
  // Fail on unreadable archives instead of advertising fictitious capacity.
  extractPublicationRecords(source);
  const ids = new Set();
  const questions = new Set();
  for (const brief of briefs) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(brief.id || "") || ids.has(brief.id)) {
      throw new Error(`Invalid or duplicate editorial brief ID: ${brief.id}`);
    }
    ids.add(brief.id);
    if (typeof brief.area !== "string" || brief.area.trim().length < 10 ||
      !Array.isArray(brief.evidence) || new Set(brief.evidence).size < 2 ||
      brief.evidence.some((item) => typeof item !== "string" || item.trim().length < 30)) {
      throw new Error(`Editorial brief ${brief.id} needs a concrete area and distinct operating recommendations.`);
    }
    if (brief.readerQuestion) {
      const question = normalizeWords(brief.readerQuestion).join(" ");
      if (questions.has(question)) throw new Error(`Repeated reader question in editorial brief ${brief.id}.`);
      questions.add(question);
    }
  }
  const unused = unusedEditorialBriefs(briefs, extractExistingArticleSignals(source));
  return { total: briefs.length, consumed: briefs.length - unused.length, remaining: unused.length, level: capacityLevel(unused.length), unused };
}

export function healthSummary(health) {
  return `## SEO editorial capacity\n\n` +
    `| Total briefs | Consumed | Unused | Review state |\n| --- | --- | --- | --- |\n` +
    `| ${health.total} | ${health.consumed} | ${health.remaining} | ${health.level} |\n\n` +
    `At one publication per day this is at most ${health.remaining} further publishing days; quality rejections may reduce usable capacity. ` +
    `Replenishment starts at ${REPLENISH_AT} unused briefs. Retired and superseded articles count as existing coverage.\n`;
}

function issueBody(health, runUrl) {
  return `${marker}\n<!-- level:${health.level} -->\n\n${healthSummary(health)}\n` +
    `Observed at this checkpoint: [workflow run](${runUrl}).\n\n` +
    `Review the full archive and add at least ${Math.max(0, 60 - health.remaining)} distinct, grounded reader questions to restore a 60-day editorial buffer. ` +
    `Do not rename covered briefs, weaken duplicate checks or recycle articles. Run the editorial plan probes before merging.\n\n` +
    `Remaining reader questions:\n${health.unused.map((brief) => `- ${brief.id}: ${brief.readerQuestion || brief.area}`).join("\n") || "- None; generation will stop before contacting DeepSeek."}\n`;
}

// Maintain one repository-owned issue. Normal days cause no issue mutation;
// escalation happens only at 30, 14, 7 and 0 briefs. Recovery closes the issue.
export async function syncCapacityIssue({ health, repository, token, runUrl, request = fetch, automatic = false, consecutiveFailures = 0 }) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || "") || !token) {
    throw new Error("Capacity notification requires GITHUB_REPOSITORY and a scoped GITHUB_TOKEN.");
  }
  const api = async (endpoint, method = "GET", body) => {
    const response = await request(`https://api.github.com/repos/${repository}${endpoint}`, {
      method, signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error(`Capacity issue API returned HTTP ${response.status}; check issues:write permission.`);
    return response.json();
  };
  let issue;
  for (let page = 1; ; page += 1) {
    if (page > 10) throw new Error("Capacity issue lookup exceeded its bounded page limit.");
    const issues = await api(`/issues?state=all&creator=github-actions%5Bbot%5D&per_page=100&page=${page}`);
    issue = issues.find((item) => !item.pull_request && item.body?.includes(marker));
    if (issue || issues.length < 100) break;
  }
  if (health.level === "healthy") {
    if (issue?.state === "open") await api(`/issues/${issue.number}`, "PATCH", { state: "closed", state_reason: "completed" });
    return { action: issue?.state === "open" ? "closed" : "none" };
  }
  // A normal threshold crossing is handled by the independent automatic
  // refill. Notify only if that recovery has repeatedly failed or stock is
  // critically low; do not turn an expected refill into a human alert.
  if (automatic && health.remaining > 7 && consecutiveFailures < 2) return { action: "none", reason: "automatic refill pending" };
  const body = issueBody(health, runUrl);
  if (!issue) {
    const created = await api("/issues", "POST", { title: "SEO editorial pool needs replenishment", body });
    return { action: "created", url: created.html_url };
  }
  if (issue.state !== "open" || !issue.body?.includes(`<!-- level:${health.level} -->`)) {
    await api(`/issues/${issue.number}`, "PATCH", { state: "open", body });
    return { action: "updated", url: issue.html_url };
  }
  return { action: "none", url: issue.html_url };
}

async function main() {
  const source = await readFile(process.env.ARTICLES_PATH || new URL("../app/insights/articles.ts", import.meta.url), "utf8");
  const health = inspectEditorialPool(source);
  console.log(JSON.stringify({ ...health, unused: health.unused.map((brief) => brief.id) }));
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `remaining=${health.remaining}\nlevel=${health.level}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, healthSummary(health));
  if (health.level !== "healthy") console.warn(`::warning::Editorial pool needs review: ${health.remaining} unused brief(s), state ${health.level}.`);
  if (process.argv.includes("--notify")) {
    console.log(await syncCapacityIssue({ health, repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN,
      automatic: true, consecutiveFailures: autoPool.consecutiveFailures,
      runUrl: `${process.env.GITHUB_SERVER_URL || "https://github.com"}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` }));
  }
  if (health.level === "depleted" && process.argv.includes("--require-capacity")) throw new Error("No unused editorial briefs remain. Replenish the pool before publication.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
