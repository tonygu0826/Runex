import assert from "node:assert/strict";
import test from "node:test";

import {
  formatExistingCoverage,
  qualityFailureAction,
  retryInstruction,
  selectableBriefsForAttempt,
  seoGenerationSettings,
} from "../scripts/seo-generation-policy.mjs";

test("uses a bounded, configurable generation attempt limit", () => {
  assert.deepEqual(seoGenerationSettings({}), { maxAttempts: 6 });
  assert.deepEqual(seoGenerationSettings({ SEO_GENERATION_MAX_ATTEMPTS: "4" }), { maxAttempts: 4 });
  assert.deepEqual(seoGenerationSettings({ SEO_GENERATION_MAX_ATTEMPTS: "99" }), { maxAttempts: 8 });
  assert.deepEqual(seoGenerationSettings({ SEO_GENERATION_MAX_ATTEMPTS: "invalid" }), { maxAttempts: 6 });
});

test("gives the model existing titles, brief ids and keywords", () => {
  assert.equal(
    formatExistingCoverage([
      { briefId: "returns-control", title: "A Returns Workflow", keywords: ["returns inspection", "disposition"] },
      { briefId: "", title: "An Older Article", keywords: [] },
    ]),
    "- briefId: returns-control; title: A Returns Workflow; keywords: returns inspection, disposition\n- title: An Older Article",
  );
});

test("switches briefs for topic collisions but repairs bounded field failures", () => {
  assert.equal(qualityFailureAction('Topic overlaps with existing article "Old".'), "switch-brief");
  assert.equal(qualityFailureAction("Article overlaps too heavily with existing site copy."), "switch-brief");
  assert.equal(qualityFailureAction('Title "New" is too similar to existing title "Old".'), "switch-brief");
  assert.equal(qualityFailureAction("Excerpt is 225 characters; shorten it."), "repair-draft");
  assert.equal(qualityFailureAction('Article contains unsupported wording: "always".'), "repair-draft");
  assert.equal(qualityFailureAction("DeepSeek request timed out after 120000 ms."), "fresh-draft");
});

test("removes rejected briefs from scheduled retries", () => {
  const briefs = [{ id: "one" }, { id: "two" }, { id: "three" }];
  assert.deepEqual(
    selectableBriefsForAttempt({ briefs, blockedBriefIds: new Set(["two"]), requestedTopic: "" }),
    [{ id: "one" }, { id: "three" }],
  );
  assert.deepEqual(
    selectableBriefsForAttempt({ briefs, blockedBriefIds: new Set(["two"]), requestedTopic: "manual topic" }),
    [{ id: "one" }, { id: "three" }],
  );
});

test("tells a retry to abandon a colliding brief", () => {
  const instruction = retryInstruction({
    action: "switch-brief",
    errorMessage: "Topic overlaps with existing coverage.",
    failedBriefId: "overflow-control",
  });
  assert.match(instruction, /Do not use briefId "overflow-control" again/);
  assert.match(instruction, /completely new article/);
  assert.doesNotMatch(instruction, /corrected JSON/);
});
