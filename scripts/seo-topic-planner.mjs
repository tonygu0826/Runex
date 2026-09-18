import { formatExistingCoverage } from "./seo-generation-policy.mjs";
import { findTopicCollision, jaccard, normalizeWords, slugifyTitle } from "./seo-quality.mjs";

export const GENERATION_BUDGET_MS = 14 * 60_000;

export function unusedEditorialBriefs(briefs, existingArticles) {
  // Check the ENTIRE archive, including superseded pages and pre-briefId articles.
  // A manual topic does not bypass this rule. Exhaustion requires new editorial input.
  return briefs.filter((brief) => !existingArticles.some((article) =>
    article.briefId === brief.id ||
    new Set((article.operationalBasis || []).filter((item) => brief.evidence.includes(item))).size >= 2,
  ));
}

export function rotateBriefs(briefs, runNumber = "0") {
  if (!briefs.length) return [];
  // Adjacent scheduled runs start in different six-brief windows when the pool
  // is large enough, so the backup does not simply repeat the primary shortlist.
  const offset = (Math.abs(Number.parseInt(runNumber, 10) || 0) * 6) % briefs.length;
  return [...briefs.slice(offset), ...briefs.slice(0, offset)];
}

function boundedText(value, field, min, max) {
  if (typeof value !== "string" || value.trim().length < min) throw new Error(`Invalid ${field}; at least ${min} characters are required.`);
  const text = value.trim();
  if (text.length > max) throw new Error(`${field} is ${text.length} characters; shorten it to ${max} characters or fewer while keeping it complete.`);
  return text;
}

export function assertSupportedWording(text, approvedSources = []) {
  const patterns = [
    /\b(in (my|our) experience|we have (seen|found|helped)|our clients?|customer results?)\b/i,
    /\b(guarantee[sd]?|always|never fails?|eliminates? (all|the)?)\b/i,
    /\b\d+(?:\.\d+)?\s*%/,
    /\b(studies show|research proves|industry data shows)\b/i,
  ];
  const match = patterns.map((pattern) => text.match(pattern)?.[0]).find(Boolean);
  if (match) throw new Error(`Article contains unsupported wording: "${match}". Remove or rewrite that claim without replacing it with another absolute or unsourced claim.`);
  if (!approvedSources.length && /\b(customs|tariff|tax law|regulation|statutory|legally required)\b/i.test(text)) {
    throw new Error("External or regulatory claim requires an approved source.");
  }
}

export function validateTopicMetadata(generated, briefs, existingArticles) {
  if (!generated || typeof generated !== "object") throw new Error("Expected a topic JSON object.");
  const brief = briefs.find((item) => item.id === generated.briefId);
  if (!brief) throw new Error(`Brief "${generated.briefId}" is not allowed in this attempt. Choose one currently supplied briefId.`);
  const title = boundedText(generated.title, "Title", 20, 90);
  const description = boundedText(generated.description, "Description", 70, 180);
  const excerpt = boundedText(generated.excerpt, "Excerpt", 40, 220);
  const keyAnswer = boundedText(generated.keyAnswer, "keyAnswer", 60, 1_000);
  if (!Array.isArray(generated.keywords) || generated.keywords.length < 3 || generated.keywords.length > 6) throw new Error("Keywords must contain 3-6 items.");
  const keywords = [...new Set(generated.keywords.map((item) => boundedText(item, "keyword", 4, 100)))];
  if (keywords.length < 3) throw new Error("Keywords must be unique.");
  const operationalBasis = Array.isArray(generated.operationalBasis) ? [...new Set(generated.operationalBasis)] : [];
  if (operationalBasis.length < 2 || operationalBasis.some((item) => !brief.evidence.includes(item))) {
    throw new Error("Operational basis must reproduce at least two distinct supplied evidence statements exactly.");
  }
  const slug = slugifyTitle(title);
  if (!slug) throw new Error(`Title "${title}" cannot produce a valid URL slug. Use a clear English title.`);
  if (existingArticles.some((item) => item.slug === slug)) throw new Error(`Title "${title}" produces an existing URL slug "${slug}". Choose a different search intent and title.`);
  const metadata = { briefId: brief.id, title, description, excerpt, keywords, keyAnswer, operationalBasis };
  const collision = findTopicCollision(metadata, existingArticles);
  if (collision) throw new Error(`Topic overlaps with existing article "${collision.existing.title}": ${collision.reason}. Choose another editorial brief or a materially different search intent.`);
  return metadata;
}

export function validateTopicPlan(generated, briefs, existingArticles, approvedSources = []) {
  const metadata = validateTopicMetadata(generated, briefs, existingArticles);
  const brief = briefs.find((item) => item.id === metadata.briefId);
  const searchIntent = boundedText(generated.searchIntent, "searchIntent", 30, 240);
  if (brief.readerQuestion && searchIntent !== brief.readerQuestion) {
    throw new Error("searchIntent must copy the supplied readerQuestion exactly; do not rename an old topic.");
  }
  // Compare coverage of a short question, not symmetric similarity to a much
  // longer answer (which penalises useful detail). This is a lexical scope guard,
  // not a claim of perfect semantic duplicate detection.
  const questionWords = new Set(normalizeWords(searchIntent));
  const answerWords = new Set(normalizeWords(`${metadata.title} ${metadata.keyAnswer} ${metadata.keywords.join(" ")}`));
  const coveredWords = [...questionWords].filter((word) => answerWords.has(word)).length;
  if (coveredWords / Math.max(1, questionWords.size) < 0.35) {
    throw new Error("Topic plan does not answer its supplied readerQuestion. Keep the title and answer focused on that question.");
  }
  if (!Array.isArray(generated.outline) || generated.outline.length < 3 || generated.outline.length > 6) throw new Error("Topic outline must contain 3-6 useful section headings.");
  const outline = generated.outline.map((item) => boundedText(item, "outline heading", 5, 90));
  if (new Set(outline.map((item) => item.toLowerCase())).size !== outline.length) throw new Error("Topic outline headings must be distinct.");
  assertSupportedWording([metadata.title, metadata.description, metadata.excerpt, metadata.keyAnswer, ...metadata.keywords, searchIntent, ...outline].join(" "), approvedSources);
  const collision = findTopicCollision({ ...metadata, searchIntent }, existingArticles);
  if (collision) throw new Error(`Topic overlaps with existing article "${collision.existing.title}": ${collision.reason}. Choose a different reader question.`);
  return { ...metadata, searchIntent, outline };
}

export function assertDraftFollowsPlan(generated, plan) {
  if (generated?.briefId !== plan.briefId || generated?.title?.trim() !== plan.title) {
    throw new Error("Draft changed the approved briefId or title. Restore the approved plan; do not change its search intent.");
  }
  const answer = `${generated?.keyAnswer || ""} ${(generated?.keywords || []).join(" ")}`;
  if (jaccard(`${plan.searchIntent} ${plan.keyAnswer} ${plan.keywords.join(" ")}`, answer) < 0.2) {
    throw new Error("Draft drifted from the approved search intent. Answer the planned reader question directly.");
  }
}

export function buildTopicPlanningPrompt({ briefs, existingArticles, requestedTopic = "" }) {
  return `PLAN_ONLY: Return a short topic plan, not a full article. Choose one supplied, unused editorial brief.
${requestedTopic ? `The plan must address this requested topic: ${requestedTopic}. If no supplied brief supports it, return {"unavailable": true, "reason": "explanation"}; do not force a mismatch.` : "Choose a practical reader question absent from the archive."}
Do not invent evidence, rename a covered topic or return sections/paragraphs. Keep the outline specific to the supplied question, not a generic receiving, inventory-status or decision-ownership overview.
Unused briefs (operational evidence is guidance, not a claim about Runex's capabilities):
${JSON.stringify(briefs, null, 2)}
Existing coverage; changing wording does not create a new search intent:
${formatExistingCoverage(existingArticles)}
Return {"briefId":"supplied id","searchIntent":"copy its readerQuestion exactly, or state one narrow question if none is supplied","title":"complete phrase, 20-75 characters","description":"complete sentence, 70-160 characters","excerpt":"complete summary, 40-200 characters","keywords":["3-6 specific phrases"],"keyAnswer":"2-3 self-contained sentences answering the question, at least 60 characters","operationalBasis":["at least two distinct exact evidence statements from the chosen brief"],"outline":["3-6 specific section headings"]}.
Do not make first-hand claims, guarantees, percentages, studies or regulatory claims. No absolute wording such as always or eliminates all.`;
}
