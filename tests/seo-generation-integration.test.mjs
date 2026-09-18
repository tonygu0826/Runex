import assert from "node:assert/strict";
import test from "node:test";
import { generateSeoArticle } from "../scripts/generate-seo-article.mjs";
import { granularBriefs, legacyBriefs } from "../scripts/seo-editorial-briefs.mjs";
import { extractExistingArticleSignals } from "../scripts/seo-quality.mjs";
import { GENERATION_BUDGET_MS } from "../scripts/seo-topic-planner.mjs";
import { planFor, unitDraft, unitPlan } from "./fixtures/seo-plans.mjs";
import { historicalArchive as archive, historicalSource as realSource } from "./fixtures/seo-archive.mjs";

function harness(responses, overrides = {}) {
  const writes = [];
  const calls = [];
  const logs = [];
  return {
    writes, calls, logs,
    run: () => generateSeoArticle({
      env: { DEEPSEEK_API_KEY: "mock-only", DEEPSEEK_RETRY_DELAY_MS: "1" },
      readSource: async () => realSource,
      writeSource: async (_path, data) => writes.push(data),
      logger: { log: (message) => logs.push(message), warn: (message) => logs.push(message) },
      wait: async () => {},
      requestContent: async (request) => {
        calls.push(request);
        const response = typeof responses === "function" ? responses(request, calls.length) : responses[calls.length - 1];
        if (response instanceof Error) throw response;
        return typeof response === "string" ? response : JSON.stringify(response);
      },
      ...overrides,
    }),
  };
}

test("plans first against the real archive, then validates and writes exactly one full article", async () => {
  const h = harness([unitPlan, unitDraft()]);
  const result = await h.run();
  assert.equal(h.calls.length, 2);
  assert.match(h.calls[0].messages[1].content, /PLAN_ONLY/);
  assert.match(h.calls[1].messages[1].content, /WRITE_ARTICLE/);
  assert.equal(h.calls[0].maxTokens, 2_000);
  assert.equal(h.calls[1].maxTokens, 8_000);
  assert.equal(h.writes.length, 1);
  const articles = extractExistingArticleSignals(h.writes[0]);
  assert.equal(articles.length, archive.length + 1);
  assert.equal(articles[0].searchIntent, unitPlan.searchIntent);
  assert.equal(articles[0].briefId, unitPlan.briefId);
  assert.deepEqual(articles.slice(1), archive);
  assert.ok(result.wordCount >= 450 && result.article.qualityGatePassed);
});

test("rejects a colliding plan, excludes its brief, and finds a new plan before drafting", async () => {
  const badPlan = { ...planFor(granularBriefs[1]), title: archive[0].title };
  const h = harness([badPlan, unitPlan, unitDraft()]);
  await h.run();
  assert.deepEqual(h.calls.map((call) => call.messages[1].content.startsWith("PLAN_ONLY")), [true, true, false]);
  assert.doesNotMatch(h.calls[1].messages[1].content, /"id": "sku-alias-mapping"/);
  assert.equal(h.writes.length, 1);
});

test("repairs a plan's exact metadata error before spending a request on prose", async () => {
  const h = harness([{ ...unitPlan, description: "x".repeat(181) }, unitPlan, unitDraft()]);
  await h.run();
  assert.match(h.calls[1].messages.map((item) => item.content).join("\n"), /shorten it to 180/);
  assert.match(h.calls[1].messages[1].content, /PLAN_ONLY/);
  assert.equal(h.writes.length, 1);
});

test("repairs unsafe draft wording without discarding the approved plan or relaxing the gate", async () => {
  const draft = unitDraft();
  draft.sections[0].paragraphs[0] += " This always works.";
  const h = harness([unitPlan, draft, unitDraft()]);
  await h.run();
  assert.match(h.calls[2].messages[1].content, /WRITE_ARTICLE/);
  assert.match(h.calls[2].messages.map((item) => item.content).join("\n"), /unsupported wording: "always"/);
  assert.doesNotMatch(h.writes[0].split('"searchIntent"')[0], /This always works/);
});

test("exhausted legacy pool fails without any API request or write, including a manual topic", async () => {
  const h = harness([], { briefs: legacyBriefs, env: { DEEPSEEK_API_KEY: "mock-only", ARTICLE_TOPIC: "returns" } });
  await assert.rejects(h.run(), /No unused editorial briefs remain/);
  assert.equal(h.calls.length, 0);
  assert.equal(h.writes.length, 0);
});

test("a manual topic can use the whole unused pool without bypassing coverage checks", async () => {
  const h = harness([unitPlan, unitDraft()], {
    env: { DEEPSEEK_API_KEY: "mock-only", ARTICLE_TOPIC: "each, inner-pack and case quantities", GITHUB_RUN_NUMBER: "121" },
  });
  await h.run();
  assert.match(h.calls[0].messages[1].content, /"id": "unit-of-measure-conversions"/);
  assert.doesNotMatch(h.calls[0].messages[1].content, /"id": "returns-control"/);
  assert.equal(h.writes.length, 1);
});

test("low unused inventory warns before depletion, without recycling covered briefs", async () => {
  const h = harness([unitPlan, unitDraft()], { briefs: [...legacyBriefs, granularBriefs[0]] });
  await h.run();
  assert.ok(h.logs.some((line) => /::warning::Editorial pool is low: 1 unused/.test(line)));
});

test("does not overwrite a source file changed while the model was working", async () => {
  let reads = 0;
  const h = harness([unitPlan, unitDraft()], { readSource: async () => ++reads === 1 ? realSource : `${realSource}\n// concurrent edit` });
  await assert.rejects(h.run(), /refusing to overwrite newer content/);
  assert.equal(h.writes.length, 0);
});

test("planning and drafting share one request budget; invalid plans cannot write a file", async () => {
  const h = harness(() => ({ ...unitPlan, operationalBasis: ["fabricated", "invented"] }));
  await assert.rejects(h.run(), /No article was published after 5 API requests/);
  assert.equal(h.calls.length, 5);
  assert.ok(h.calls.every((call) => call.maxTokens === 2_000));
  assert.equal(h.writes.length, 0);
});

test("network failures use bounded retries and do not mistake a plan for a published article", async () => {
  const h = harness((_request, number) => number === 1 ? unitPlan : new Error("DeepSeek request timed out after 120000 ms."));
  await assert.rejects(h.run(), /No article was published after 6 API requests/);
  assert.equal(h.calls.length, 6);
  assert.equal(h.writes.length, 0);
});

test("a body that copies existing prose is rejected and requires replanning", async () => {
  const draft = unitDraft();
  draft.sections.forEach((section) => { section.paragraphs = [archive.slice(0, 8).map((article) => article.keyAnswer).join(" ")]; });
  const h = harness([unitPlan, draft, planFor(granularBriefs[1]), new Error("DeepSeek request timed out after 120000 ms.")], {
    env: { DEEPSEEK_API_KEY: "mock-only", SEO_GENERATION_MAX_ATTEMPTS: "4" },
  });
  await assert.rejects(h.run(), /No article was published/);
  assert.ok(h.logs.some((line) => /overlaps too heavily/.test(line)), h.logs.join("\n"));
  assert.match(h.calls[2].messages[1].content, /PLAN_ONLY/);
  assert.doesNotMatch(h.calls[2].messages[1].content, /"id": "unit-of-measure-conversions"/);
  assert.equal(h.writes.length, 0);
});

test("the total deadline reserves build time and caps even oversized configured request timeouts", async () => {
  let clock = Date.UTC(2026, 8, 18);
  const h = harness(() => { clock += GENERATION_BUDGET_MS; return new Error("DeepSeek request timed out after 120000 ms."); }, {
    env: { DEEPSEEK_API_KEY: "mock-only", DEEPSEEK_REQUEST_TIMEOUT_MS: "9999999" },
    now: () => clock,
  });
  await assert.rejects(h.run(), /14-minute generation budget is exhausted/);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].timeoutMs, 120_000);
  assert.equal(h.writes.length, 0);
});
