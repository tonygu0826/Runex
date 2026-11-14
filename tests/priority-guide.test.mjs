import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { articleFieldProblems } from "../scripts/seo-field-repairs.mjs";
import { assertSupportedWording } from "../scripts/seo-topic-planner.mjs";
import { extractExistingArticleSignals, findTopicCollision } from "../scripts/seo-quality.mjs";

const source = readFileSync(new URL("../app/insights/articles.ts", import.meta.url), "utf8");
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { articles, getArticle } = context.exports;
const article = getArticle("carton-pallet-standards-outbound-operations");

test("revised carton guide retains its URL/date and passes reusable wording/field/novelty gates", () => {
  assert.equal(article.slug, "carton-pallet-standards-outbound-operations");
  assert.equal(article.publishedAt, "2026-07-26");
  assert.equal(article.modifiedAt, "2026-10-12");
  assert.equal(article.qualityGatePassed, true);
  assert.equal(articleFieldProblems(article, article.sources).length, 0);
  assert.doesNotThrow(() => assertSupportedWording(JSON.stringify(article), article.sources));
  const prose = [article.keyAnswer, ...article.sections.flatMap((s) => [...s.paragraphs, ...(s.bullets || [])]), ...article.faq.map((item) => item.answer)].join(" ");
  assert.ok(prose.split(/\s+/).length >= 450 && prose.split(/\s+/).length <= 1400);
  assert.ok(article.sections.length >= 3 && article.sections.length <= 6);
  const other = extractExistingArticleSignals(source).filter((item) => item.slug !== article.slug);
  assert.equal(findTopicCollision(article, other), null);
  assert.match(prose, /four cartons in the layer/);
  assert.doesNotMatch(prose, /only fit two|typically 72|allowing 26 pallets|improving pallet utilization by 50%/);
  assert.equal(article.sources.length, 2);
  assert.ok(article.sources.every((item) => /^https:\/\/(www\.fedex\.com|assets\.ups\.com)\//.test(item.url)));
});

test("legacy crossdock and returns corrections do not change indexing gates or redirect relationships", () => {
  for (const slug of ["cross-docking-faster-canadian-distribution", "building-clear-warehouse-returns-disposition-process"]) {
    const legacy = getArticle(slug);
    assert.equal(legacy.qualityGatePassed, undefined);
    assert.equal(legacy.slug, slug);
    assert.equal(legacy.modifiedAt, "2026-10-12");
    assert.doesNotMatch(JSON.stringify(legacy), /10%|24 to 48 hours|say 7 days|restocked immediately|unsalvageable items/);
  }
  assert.equal(getArticle("returns-disposition-workflow-decision-ownership").slug, "how-to-scope-returns-inspection-work-before-it-begins");
  assert.equal(articles.filter((item) => item.slug === article.slug).length, 1);
});
