import assert from "node:assert/strict";
import test from "node:test";
import { editorialBriefs, granularBriefs, legacyBriefs } from "../scripts/seo-editorial-briefs.mjs";
import { slugifyTitle } from "../scripts/seo-quality.mjs";
import { assertDraftFollowsPlan, assertSupportedWording, rotateBriefs, unusedEditorialBriefs, validateTopicPlan } from "../scripts/seo-topic-planner.mjs";
import { planFor, unitDraft, unitPlan } from "./fixtures/seo-plans.mjs";
import { historicalArchive as archive } from "./fixtures/seo-archive.mjs";

test("recognises that all 16 legacy briefs are consumed in the real full archive", () => {
  assert.equal(archive.length, 51);
  assert.equal(legacyBriefs.length, 16);
  assert.deepEqual(unusedEditorialBriefs(legacyBriefs, archive), []);
  assert.equal(granularBriefs.length, 24);
  assert.equal(new Set(editorialBriefs.map((brief) => brief.id)).size, editorialBriefs.length);
});

test("the 24 granular plan probes pass unchanged topic gates against the archive and one another", () => {
  // Use hypothetical metadata, not real API output, against the pre-fix archive.
  const coverage = [...archive];
  for (const brief of unusedEditorialBriefs(granularBriefs, archive)) {
    const plan = validateTopicPlan(planFor(brief), [brief], coverage);
    coverage.unshift({ ...plan, slug: slugifyTitle(plan.title) });
    assert.ok(!unusedEditorialBriefs([brief], coverage).length);
  }
});

test("checks pre-briefId evidence outside the recent window and disallows renamed evidence", () => {
  const brief = granularBriefs[0];
  const oldArticle = { title: "Old title", slug: "old", operationalBasis: brief.evidence.slice(0, 2) };
  const coverage = [...Array.from({ length: 20 }, () => ({ title: "Other", operationalBasis: [] })), oldArticle];
  assert.deepEqual(unusedEditorialBriefs([brief, { ...brief, id: "renamed-topic" }], coverage), []);
  assert.equal(unusedEditorialBriefs([brief], [{ operationalBasis: [brief.evidence[0], brief.evidence[0]] }]).length, 1);
});

test("rejects old coverage under a new brief id before drafting", () => {
  assert.throws(() => validateTopicPlan({ ...unitPlan, title: archive[0].title }, granularBriefs, archive), /existing URL slug|Topic overlaps/);
});

test("rejects invented evidence, duplicate evidence and a replaced reader question", () => {
  for (const operationalBasis of [["Invented one", "Invented two"], [unitPlan.operationalBasis[0], unitPlan.operationalBasis[0]], {}]) {
    assert.throws(() => validateTopicPlan({ ...unitPlan, operationalBasis }, granularBriefs, []), /two distinct supplied evidence/);
  }
  assert.throws(() => validateTopicPlan({ ...unitPlan, searchIntent: "How should every warehouse assign owners to returns?" }, granularBriefs, []), /copy the supplied readerQuestion/);
});

test("validates plan lengths, unsafe wording and outline before any article is written", () => {
  assert.throws(() => validateTopicPlan({ ...unitPlan, description: "x".repeat(181) }, granularBriefs, []), /180 characters/);
  assert.throws(() => validateTopicPlan({ ...unitPlan, keyAnswer: `${unitPlan.keyAnswer} This always works.` }, granularBriefs, []), /unsupported wording/);
  assert.throws(() => validateTopicPlan({ ...unitPlan, outline: ["Repeated heading", "Repeated heading", "Other heading"] }, granularBriefs, []), /distinct/);
  assert.throws(() => assertSupportedWording("Produces a 90% reduction."), /unsupported wording/);
});

test("rejects drafts that change the approved topic or drift to another answer", () => {
  assert.doesNotThrow(() => assertDraftFollowsPlan(unitDraft(), unitPlan));
  assert.throws(() => assertDraftFollowsPlan({ ...unitDraft(), briefId: "returns-control" }, unitPlan), /changed the approved/);
  assert.throws(() => assertDraftFollowsPlan({ ...unitDraft(), keyAnswer: "A returns approval owner decides whether damaged stock is restocked or held.", keywords: ["returns", "owners", "damage"] }, unitPlan), /drifted/);
});

test("rotates the shortlist between primary and backup run numbers", () => {
  const primary = rotateBriefs(granularBriefs, "121").slice(0, 6);
  const backup = rotateBriefs(granularBriefs, "122").slice(0, 6);
  assert.equal(primary[0], granularBriefs[6]);
  assert.equal(backup[0], granularBriefs[12]);
  assert.ok(primary.every((brief) => !backup.includes(brief)));
  assert.deepEqual(rotateBriefs([], "5"), []);
  assert.deepEqual(rotateBriefs(granularBriefs, "invalid"), granularBriefs);
});
