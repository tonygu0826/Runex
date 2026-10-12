import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { manualEditorialBriefs, legacyBriefs } from "../scripts/seo-editorial-briefs.mjs";
import { editorialFoundation } from "../scripts/seo-editorial-foundation.mjs";
import { extractExistingArticleSignals } from "../scripts/seo-quality.mjs";
import { inspectEditorialPool } from "../scripts/seo-editorial-health.mjs";
import { acceptedSemanticReviews, replenishEditorialPool, validateAutoStore, validatePendingPool, validateProposedBrief } from "../scripts/seo-replenishment.mjs";
import { refillCandidates } from "./fixtures/seo-refill.mjs";

const source = await readFile(new URL("../app/insights/articles.ts", import.meta.url), "utf8");
// These are hypothetical candidate fixtures. Later auto publications must not
// invalidate tests by consuming them, so exclude only auto-generated articles
// from this fixture coverage; the real runtime uses the ENTIRE source.
const marker = "export const articles: Article[] = [";
const anchor = source.indexOf('"slug": "checking-dispatch-manifest-after-carrier-label-voided"');
const start = source.lastIndexOf("\n  {", anchor);
assert.ok(anchor >= 0 && start > source.indexOf(marker));
const beforeAuto = source.slice(0, source.indexOf(marker) + marker.length) + source.slice(start);
const articles = extractExistingArticleSignals(beforeAuto);
const empty = () => ({ version: 1, briefs: [], refillPending: false, consecutiveFailures: 0 });
const validate = (raw, existingBriefs = manualEditorialBriefs) => validateProposedBrief(raw, { existingArticles: articles, existingBriefs });
const approved = (candidate) => ({ ...candidate, review: { approved: true, model: "mock-only", at: "2026-10-12T20:00:00Z", rationale: "The cited principles support the distinct task and its conditional recommendations." } });
const reviews = (candidates, extra = {}) => ({ reviews: candidates.map((item) => ({ id: item.id, accept: true, supported: true, distinct: true,
  reason: "The cited identity and instruction principles support this distinct operational decision.", ...extra })) });

test("new automatic candidates must cite approved principles and pass the existing topic gates", () => {
  const candidates = refillCandidates();
  const first = validate(candidates[0]);
  const second = validate(candidates[1], [...manualEditorialBriefs, first]);
  assert.match(first.id, /^auto-/);
  assert.equal(first.readerQuestion, first.reviewedPlan.searchIntent);
  assert.ok(second.id !== first.id);
  assert.throws(() => validate({ ...candidates[0], foundationRefs: ["invented", "unverified"] }), /approved foundation IDs/);
  assert.throws(() => validate({ ...candidates[0], evidence: ["A rule", "A rule"] }), /evidence/);
  assert.throws(() => validate({ ...candidates[0], plan: { ...candidates[0].plan, keyAnswer: "This always works for every warehouse operator." } }), /unsupported wording/);
  assert.throws(() => validate({ ...candidates[0], area: "Runex provides warehouse services" }), /service claims/);
  assert.throws(() => validate({ ...candidates[0], readerQuestion: articles[0].searchIntent }), /overlaps existing coverage/);
  assert.throws(() => validate(candidates[0], [...manualEditorialBriefs, first]), /identifier already exists/);
  assert.throws(() => validate({ ...candidates[0], evidence: legacyBriefs[0].evidence }), /reuse two evidence/);
});

test("semantic review cannot approve a partially supported or duplicate candidate", () => {
  const candidate = validate(refillCandidates()[0]);
  assert.equal(acceptedSemanticReviews(reviews([candidate]), [candidate]).accepted.size, 1);
  assert.equal(acceptedSemanticReviews(reviews([candidate], { supported: false }), [candidate]).accepted.size, 0);
  assert.equal(acceptedSemanticReviews(reviews([candidate], { distinct: false }), [candidate]).accepted.size, 0);
  assert.throws(() => acceptedSemanticReviews({ reviews: [] }, [candidate]), /every candidate/);
  assert.throws(() => acceptedSemanticReviews(reviews([{ id: "foreign" }]), [candidate]), /Invalid or incomplete/);
});

test("the committed automatic pool contains only structurally validated, reviewed records", async () => {
  const committed = JSON.parse(await readFile(new URL("../scripts/seo-auto-briefs.json", import.meta.url), "utf8"));
  assert.doesNotThrow(() => validateAutoStore(committed));
  const brief = approved(validate(refillCandidates()[0]));
  assert.throws(() => validateAutoStore({ ...empty(), briefs: [{ ...brief, review: { ...brief.review, approved: false } }] }), /Unreviewed/);
  assert.throws(() => validateAutoStore({ ...empty(), briefs: [{ ...brief, id: "auto-artificial-rename" }] }), /Unreviewed/);
});

function harness({ store = empty(), manualBriefs = manualEditorialBriefs, responder, clock = () => Date.UTC(2026, 9, 12, 20), readOverride } = {}) {
  let pool = JSON.stringify(store);
  const calls = [];
  const writes = [];
  const raw = refillCandidates();
  const candidates = raw.map((item, index) => validate(item, [...manualBriefs, ...raw.slice(0, index).map((prior) => validate(prior, manualBriefs))]));
  return { calls, writes, get pool() { return JSON.parse(pool); }, run: () => replenishEditorialPool({
    env: { DEEPSEEK_API_KEY: "test-only", DEEPSEEK_RETRY_DELAY_MS: "1", ARTICLES_PATH: "archive", SEO_AUTO_POOL_PATH: "pool" },
    manualBriefs, foundation: editorialFoundation, now: clock, wait: async () => {}, logger: { log() {}, warn() {} },
    readSource: readOverride || (async (path) => path === "archive" ? beforeAuto : pool),
    writeSource: async (path, value) => { assert.equal(path, "pool"); writes.push(value); pool = value; },
    requestContent: async (request) => { calls.push(request); const value = responder ? responder(request, calls.length, candidates) :
      request.messages[1].content.startsWith("PROPOSE") ? { briefs: raw } : reviews(candidates);
      if (value instanceof Error) throw value; return typeof value === "string" ? value : JSON.stringify(value); },
  }) };
}

test("initial bootstrap really proposes, independently reviews and saves only a small batch", async () => {
  const h = harness();
  const result = await h.run();
  assert.equal(result.added, 2);
  assert.equal(result.requests, 2);
  assert.equal(result.remaining, 63);
  assert.equal(h.writes.length, 1);
  assert.ok(h.calls[0].messages[1].content.startsWith("PROPOSE_NEW_BRIEFS"));
  assert.ok(h.calls[1].messages[1].content.startsWith("INDEPENDENT_SEMANTIC_REVIEW"));
  assert.ok(h.pool.briefs.every((item) => item.review.approved));
  assert.equal(h.pool.refillPending, false);
  validateAutoStore(h.pool);
  assert.equal(inspectEditorialPool(beforeAuto, [...manualEditorialBriefs, ...h.pool.briefs]).remaining, 63);
});

test("a healthy initialized pool makes no provider call or repository write", async () => {
  const first = approved(validate(refillCandidates()[0]));
  const h = harness({ store: { ...empty(), briefs: [first] } });
  assert.equal((await h.run()).status, "skipped");
  assert.equal(h.calls.length, 0);
  assert.equal(h.writes.length, 0);
});

test("low inventory saves only reviewed progress and keeps a partial refill pending", async () => {
  const h = harness({ manualBriefs: legacyBriefs });
  const result = await h.run();
  assert.equal(result.added, 2);
  assert.equal(result.pending, true);
  assert.ok(result.requests <= 6);
  assert.equal(h.pool.refillPending, true);
});

test("rejected semantic input exhausts the bounded retry budget without adding a brief", async () => {
  const h = harness({ responder: (request, _number, candidates) => request.messages[1].content.startsWith("PROPOSE") ? { briefs: refillCandidates() } : reviews(candidates, { supported: false, accept: false }) });
  await assert.rejects(h.run(), /No automatic brief was approved after 6 requests/);
  assert.equal(h.calls.length, 6);
  assert.equal(h.writes.length, 0);
});

test("network failures and oversized timeout settings remain bounded", async () => {
  const h = harness({ responder: () => new Error("DeepSeek request timed out after 120000 ms.") });
  await assert.rejects(h.run(), /No automatic brief was approved/);
  assert.ok(h.calls.length <= 6);
  assert.ok(h.calls.every((item) => item.timeoutMs <= 120_000));
  assert.equal(h.writes.length, 0);
});

test("a concurrent article change aborts a stale replenishment write", async () => {
  let reads = 0;
  const pool = JSON.stringify(empty());
  const h = harness({ readOverride: async (path) => path === "pool" ? pool : ++reads === 1 ? beforeAuto : `${beforeAuto}\n// concurrent publication` });
  await assert.rejects(h.run(), /refusing a stale write/);
  assert.equal(h.writes.length, 0);
});

test("the final remote recheck protects approved history and newly consumed questions", () => {
  const first = approved(validate(refillCandidates()[0]));
  const second = approved(validate(refillCandidates()[1], [...manualEditorialBriefs, first]));
  const baseStore = { ...empty(), briefs: [first] };
  const nextStore = { ...empty(), briefs: [first, second] };
  assert.equal(validatePendingPool({ baseStore, nextStore, source: beforeAuto }).remaining, 63);
  assert.throws(() => validatePendingPool({ baseStore, nextStore: { ...nextStore, briefs: [second] }, source: beforeAuto }), /delete or modify/);
  const newArticle = { ...second.reviewedPlan, slug: "recently-covered", publishedAt: "2026-10-12" };
  const changedSource = beforeAuto.replace(marker, `${marker}\n${JSON.stringify(newArticle, null, 2)},`);
  assert.throws(() => validatePendingPool({ baseStore, nextStore, source: changedSource }), /overlaps existing coverage|Topic overlaps/);
});
