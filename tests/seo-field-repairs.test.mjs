import assert from "node:assert/strict";
import test from "node:test";
import { applyFieldRepairs, articleFieldProblems, ArticleFieldRepairError, buildFieldRepairPrompt } from "../scripts/seo-field-repairs.mjs";
import { granularBriefs } from "../scripts/seo-editorial-briefs.mjs";
import { unitDraft, unitPlan } from "./fixtures/seo-plans.mjs";

test("locates wording errors in metadata, body and FAQ together with their original text", () => {
  const draft = unitDraft();
  draft.excerpt += " This always works.";
  draft.sections[1].paragraphs[0] += " This is a guarantee.";
  draft.faq = [{ question: "Are case packs always identical?", answer: "Pack definitions should be confirmed before an order quantity is converted." }];
  const problems = articleFieldProblems(draft);
  assert.deepEqual(problems.map((item) => item.field), ["excerpt", "sections.1.paragraphs.0", "faq.0.question"]);
  const error = new ArticleFieldRepairError(problems);
  assert.match(error.message, /faq.0.question/);
  assert.match(error.message, /Are case packs always identical/);
  const prompt = buildFieldRepairPrompt({ plan: unitPlan, brief: granularBriefs[0], problems, approvedSources: [] });
  assert.match(prompt, /REPAIR_FIELDS_ONLY/);
  assert.match(prompt, /not always readable/);
  assert.match(prompt, /may be unreadable/);
});

test("replaces only requested fields without mutating or discarding correct content", () => {
  const draft = unitDraft();
  draft.sections[0].paragraphs[0] += " This always works.";
  const original = structuredClone(draft);
  const problems = articleFieldProblems(draft);
  const repaired = applyFieldRepairs(draft, problems, { replacements: [{ field: "sections.0.paragraphs.0", text: unitDraft().sections[0].paragraphs[0] }] });
  assert.deepEqual(repaired, unitDraft());
  assert.deepEqual(draft, original);
  assert.deepEqual(articleFieldProblems(repaired), []);
});

test("finds metadata length errors with explicit bounds instead of clipping words", () => {
  const draft = unitDraft();
  draft.description = "x".repeat(181);
  draft.excerpt = "Too short";
  const problems = articleFieldProblems(draft);
  assert.deepEqual(problems.map(({ field, minLength, maxLength }) => ({ field, minLength, maxLength })), [
    { field: "description", minLength: 70, maxLength: 180 },
    { field: "excerpt", minLength: 40, maxLength: 220 },
  ]);
});

test("rejects full articles, unrequested paths, prototype paths, duplicate or incomplete patches", () => {
  const draft = unitDraft();
  draft.excerpt += " This always works.";
  draft.sections[0].paragraphs[0] += " This always works.";
  const problems = articleFieldProblems(draft);
  const patch = { field: "excerpt", text: unitDraft().excerpt };
  const invalid = [
    unitDraft(),
    { replacements: [patch] },
    { replacements: [patch, patch] },
    { replacements: [patch, { field: "__proto__.polluted", text: "yes" }] },
    { replacements: [patch, { field: "title", text: "A different approved topic" }] },
    { replacements: [patch, { field: "sections.0.paragraphs.0", text: "" }] },
  ];
  for (const response of invalid) assert.throws(() => applyFieldRepairs(draft, problems, response));
  assert.equal({}.polluted, undefined);
});

test("a returned replacement still has to pass the unchanged wording gate", () => {
  const draft = unitDraft();
  draft.sections[0].paragraphs[0] += " This always works.";
  const repaired = applyFieldRepairs(draft, articleFieldProblems(draft), {
    replacements: [{ field: "sections.0.paragraphs.0", text: draft.sections[0].paragraphs[0] }],
  });
  assert.equal(articleFieldProblems(repaired).length, 1);
});
