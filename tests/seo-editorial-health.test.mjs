import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { editorialBriefs, manualEditorialBriefs, granularBriefs, legacyBriefs } from "../scripts/seo-editorial-briefs.mjs";
import { expandedBriefs } from "../scripts/seo-editorial-expansion.mjs";
import { capacityLevel, inspectEditorialPool, syncCapacityIssue } from "../scripts/seo-editorial-health.mjs";
import { extractExistingArticleSignals, slugifyTitle } from "../scripts/seo-quality.mjs";
import { validateTopicPlan } from "../scripts/seo-topic-planner.mjs";
import { planFor } from "./fixtures/seo-plans.mjs";

const source = await readFile(new URL("../app/insights/articles.ts", import.meta.url), "utf8");
// Freeze the entire 75-article archive at the exhaustion incident. Future
// publications prepend records; they cannot invalidate these reviewed probes.
const marker = "export const articles: Article[] = [";
const anchor = source.indexOf('"slug": "linking-serial-numbers-dispatched-order-lines"');
const start = source.lastIndexOf("\n  {", anchor);
assert.ok(anchor >= 0 && start > source.indexOf(marker), "Review the capacity regression fixture anchor.");
const exhaustedSource = source.slice(0, source.indexOf(marker) + marker.length) + source.slice(start);

test("reproduces the exhausted 40-brief pool and restores 62 distinct questions", () => {
  const oldPool = inspectEditorialPool(exhaustedSource, [...legacyBriefs, ...granularBriefs]);
  assert.equal(oldPool.remaining, 0);
  assert.equal(oldPool.level, "depleted");
  const health = inspectEditorialPool(exhaustedSource, manualEditorialBriefs);
  assert.equal(health.total, 102);
  assert.equal(health.consumed, 40);
  assert.equal(health.remaining, 62);
  assert.equal(health.level, "healthy");
});

test("every new plan probe passes unchanged gates against all past and new coverage", () => {
  const coverage = extractExistingArticleSignals(exhaustedSource);
  assert.equal(coverage.length, 75);
  for (const brief of expandedBriefs) {
    const plan = validateTopicPlan(planFor(brief), [brief], coverage);
    coverage.unshift({ ...plan, slug: slugifyTitle(plan.title, 64, plan.keywords) });
  }
  assert.equal(coverage.length, 137);
});

test("invalid input cannot create false capacity; repeated IDs/questions are rejected", () => {
  assert.throws(() => inspectEditorialPool("not the archive"), /Article array is missing/);
  assert.throws(() => inspectEditorialPool(exhaustedSource, [...editorialBriefs, expandedBriefs[0]]), /duplicate editorial brief ID/);
  assert.throws(() => inspectEditorialPool(exhaustedSource, [expandedBriefs[0], { ...expandedBriefs[0], id: "renamed-question" }]), /Repeated reader question/);
  assert.throws(() => inspectEditorialPool(exhaustedSource, [{ ...expandedBriefs[0], evidence: ["short", "short"] }]), /distinct operating recommendations/);
});

test("capacity escalates at actionable thresholds rather than every normal publication", () => {
  assert.deepEqual([31, 30, 15, 14, 8, 7, 1, 0].map(capacityLevel),
    ["healthy", "replenish", "replenish", "urgent", "urgent", "critical", "critical", "depleted"]);
});

function issueHarness(issues = []) {
  const calls = [];
  return { calls, request: async (url, options) => {
    calls.push({ url, method: options.method, body: options.body && JSON.parse(options.body) });
    return { ok: true, json: async () => options.method === "GET" ? issues : { number: 99, html_url: "https://github.com/example/repo/issues/99" } };
  } };
}
const healthFor = (remaining) => ({ total: 102, consumed: 102 - remaining, remaining, level: capacityLevel(remaining), unused: expandedBriefs.slice(0, remaining) });
const args = { repository: "example/repo", token: "test-only", runUrl: "https://github.com/example/repo/actions/runs/1" };

test("maintains one alert, leaves normal days quiet, escalates once and closes on recovery", async () => {
  const h = issueHarness();
  assert.equal((await syncCapacityIssue({ ...args, health: healthFor(62), request: h.request })).action, "none");
  assert.equal(h.calls.length, 1);
  const created = await syncCapacityIssue({ ...args, health: healthFor(30), request: h.request });
  assert.equal(created.action, "created");
  const body = h.calls.at(-1).body.body;
  assert.match(body, /restore a 60-day editorial buffer/);
  const open = { number: 99, state: "open", body, html_url: created.url };
  const same = issueHarness([open]);
  assert.equal((await syncCapacityIssue({ ...args, health: healthFor(29), request: same.request })).action, "none");
  assert.equal(same.calls.length, 1);
  const escalated = issueHarness([open]);
  assert.equal((await syncCapacityIssue({ ...args, health: healthFor(14), request: escalated.request })).action, "updated");
  assert.match(escalated.calls.at(-1).body.body, /level:urgent/);
  const recovered = issueHarness([open]);
  assert.equal((await syncCapacityIssue({ ...args, health: healthFor(62), request: recovered.request })).action, "closed");
  assert.deepEqual(recovered.calls.at(-1).body, { state: "closed", state_reason: "completed" });
  const closed = issueHarness([{ ...open, state: "closed" }]);
  assert.equal((await syncCapacityIssue({ ...args, health: healthFor(0), request: closed.request })).action, "updated");
  assert.equal(closed.calls.at(-1).body.state, "open");
});

test("an alert permission failure is explicit and cannot be misreported as a successful notification", async () => {
  await assert.rejects(syncCapacityIssue({ ...args, health: healthFor(30), request: async () => ({ ok: false, status: 403 }) }), /issues:write/);
});

test("automatic recovery suppresses routine low-pool alerts until it repeatedly fails", async () => {
  const h = issueHarness();
  assert.equal((await syncCapacityIssue({ ...args, health: healthFor(30), automatic: true, request: h.request })).action, "none");
  assert.equal(h.calls.length, 1);
  assert.equal((await syncCapacityIssue({ ...args, health: healthFor(30), automatic: true, consecutiveFailures: 2, request: h.request })).action, "created");
  const critical = issueHarness();
  assert.equal((await syncCapacityIssue({ ...args, health: healthFor(7), automatic: true, request: critical.request })).action, "created");
});
