import { assertSupportedWording } from "./seo-topic-planner.mjs";

// Locate all repairable text errors together. Rewriting an entire article for
// one word can leave that word in a summary or FAQ and introduce new defects.
export function articleFieldProblems(article, approvedSources = []) {
  const problems = [];
  const check = (path, value, minLength, maxLength = null) => {
    if (typeof value !== "string") return; // Structural errors use full validation.
    const reasons = [];
    if (value.trim().length < minLength) reasons.push(`Use at least ${minLength} characters.`);
    if (maxLength && value.trim().length > maxLength) reasons.push(`Use no more than ${maxLength} characters; keep complete sentences or phrases.`);
    try { assertSupportedWording(value, approvedSources); } catch (error) { reasons.push(error.message); }
    if (reasons.length) problems.push({ field: path.join("."), path, original: value, minLength, maxLength, reasons });
  };
  check(["title"], article?.title, 20, 90);
  check(["description"], article?.description, 70, 180);
  check(["excerpt"], article?.excerpt, 40, 220);
  check(["keyAnswer"], article?.keyAnswer, 60);
  if (Array.isArray(article?.keywords)) article.keywords.forEach((value, index) => check(["keywords", index], value, 4));
  if (Array.isArray(article?.sections)) article.sections.forEach((section, index) => {
    check(["sections", index, "heading"], section?.heading, 5, 90);
    if (Array.isArray(section?.paragraphs)) section.paragraphs.forEach((value, child) => check(["sections", index, "paragraphs", child], value, 40));
    if (Array.isArray(section?.bullets)) section.bullets.forEach((value, child) => check(["sections", index, "bullets", child], value, 10));
  });
  if (Array.isArray(article?.faq)) article.faq.forEach((item, index) => {
    check(["faq", index, "question"], item?.question, 10);
    check(["faq", index, "answer"], item?.answer, 30);
  });
  return problems;
}

export class ArticleFieldRepairError extends Error {
  constructor(problems) {
    super(`Article fields need repair:\n${problems.map((item) => `${item.field}: ${item.reasons.join(" ")} Original: ${JSON.stringify(item.original.slice(0, 280))}`).join("\n")}`);
    this.problems = problems;
  }
}

export function buildFieldRepairPrompt({ plan, brief, problems, approvedSources }) {
  return `REPAIR_FIELDS_ONLY: Correct the listed text fields, not the whole article.
The rest of the draft will be preserved and the COMPLETE article will be validated again.
Keep the original meaning, useful detail and reader question. Do not delete necessary qualifications or invent facts.
Use only these operational recommendations: ${JSON.stringify(brief.evidence)}.
Approved topic plan: ${JSON.stringify(plan)}.
Approved external sources: ${JSON.stringify(approvedSources)}.
The wording gate checks every field, including metadata, headings and FAQ questions. Avoid literal words such as "always" and "guarantee" even in questions or caveats. For example, "not always readable" may become "may be unreadable"; do not change it to "not readable". Replace sweeping promises with supported, conditional guidance. Return natural, complete text, not word fragments or padded filler.
For a length error, shorten or expand only that field while preserving its meaning and the stated bounds.
Fields to correct (replace every listed field exactly once):
${JSON.stringify(problems.map(({ field, original, minLength, maxLength, reasons }) => ({ field, original, minLength, maxLength, reasons })), null, 2)}
Return exactly {"replacements":[{"field":"an exact field path from the list","text":"complete corrected text"}]}.
No other keys. Do not change briefId, the approved title, evidence, sources or any unlisted field.`;
}

export function applyFieldRepairs(article, problems, response) {
  if (!response || typeof response !== "object" || Object.keys(response).some((key) => key !== "replacements") || !Array.isArray(response.replacements)) {
    throw new Error("Field repair must return only a replacements array, not a new article.");
  }
  const allowed = new Map(problems.map((problem) => [problem.field, problem]));
  if (response.replacements.length !== allowed.size) throw new Error("Field repair must replace every requested field exactly once.");
  const seen = new Set();
  const copy = structuredClone(article);
  for (const replacement of response.replacements) {
    const problem = allowed.get(replacement?.field);
    if (!problem || seen.has(replacement.field)) throw new Error(`Unrequested or duplicate field repair: ${replacement?.field}.`);
    if (typeof replacement.text !== "string" || !replacement.text.trim()) throw new Error(`Field repair for ${replacement.field} must contain nonempty text.`);
    seen.add(replacement.field);
    // Resolve only locally collected paths. Model-provided paths are never
    // interpreted as object traversal, preventing unrelated or prototype writes.
    let target = copy;
    for (const key of problem.path.slice(0, -1)) target = target[key];
    const key = problem.path.at(-1);
    if (target[key] !== problem.original) throw new Error(`Field changed before repair: ${problem.field}.`);
    target[key] = replacement.text.trim();
  }
  return copy;
}
