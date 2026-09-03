import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const articlesPath = process.env.ARTICLES_PATH || path.join(root, "app", "insights", "articles.ts");
const apiUrl = `${(process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com").replace(/\/$/, "")}/chat/completions`;
const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) throw new Error("DEEPSEEK_API_KEY is missing.");

const source = await readFile(articlesPath, "utf8");
const existingSlugs = [...source.matchAll(/["']?slug["']?\s*:\s*["']([^"']+)["']/g)].map((match) => match[1]);
const existingTitles = [...source.matchAll(/["']?title["']?\s*:\s*["']([^"']+)["']/g)].map((match) => match[1]);
const publishedAt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const briefs = [
  {
    id: "receiving-control",
    area: "warehouse receiving instructions, count checks and damage documentation",
    evidence: [
      "The operating plan starts with the freight profile, expected activity and known exceptions.",
      "Receiving instructions should define identification, count and damage-reporting steps.",
      "Exceptions should be documented before additional handling work proceeds.",
    ],
  },
  {
    id: "kitting-control",
    area: "repeatable kitting and light-assembly workflows for changing order volumes",
    evidence: [
      "Kitting instructions should define components, quantities, labels and the finished-unit identifier.",
      "Component inventory and finished kits need separate, visible counts.",
      "Timing and pricing for value-added work are confirmed case by case.",
    ],
  },
  {
    id: "inventory-exceptions",
    area: "inventory exception reporting, escalation and adjustment approval",
    evidence: [
      "Exceptions should identify the item, quantity, condition and required decision.",
      "A clear escalation owner prevents warehouse work from waiting without direction.",
      "Inventory adjustments should follow documented approval and reconciliation steps.",
    ],
  },
  {
    id: "quote-planning",
    area: "preparing accurate operating information for a 3PL quote",
    evidence: [
      "A useful quote begins with product dimensions, weights, quantities and handling needs.",
      "Inbound frequency, storage profile and outbound order pattern affect the operating plan.",
      "Known exceptions and client-provided instructions should be disclosed before pricing is confirmed.",
    ],
  },
  {
    id: "cross-docking",
    area: "cross-docking coordination when freight has a short transfer window",
    evidence: [
      "Cross-docking requires aligned arrival information, destination instructions and release timing.",
      "Freight condition and count exceptions need an agreed escalation path.",
      "Transportation timing is confirmed for each movement rather than assumed from a generic service promise.",
    ],
  },
  {
    id: "returns-control",
    area: "returns inspection and disposition with clear decision ownership",
    evidence: [
      "Returned inventory needs an identified status before it can be restocked, held or otherwise handled.",
      "Disposition rules should state who can approve each action and what evidence is recorded.",
      "Additional inspection, relabelling or repacking work is scoped before it proceeds.",
    ],
  },
  {
    id: "overflow-control",
    area: "maintaining inventory visibility across primary and overflow storage",
    evidence: [
      "Each storage location needs a consistent identifier and inventory status.",
      "Transfer instructions should preserve item, quantity and destination information.",
      "Cycle-count and reconciliation steps should cover both primary and overflow locations.",
    ],
  },
  {
    id: "marketplace-prep",
    area: "preparing marketplace-bound inventory from current client instructions",
    evidence: [
      "Current client-provided marketplace instructions remain the source of truth for preparation work.",
      "The work order should identify item labels, carton labels, quantities and packaging steps.",
      "Unclear or conflicting instructions should be escalated before inventory is changed.",
    ],
  },
  {
    id: "inbound-readiness",
    area: "inbound appointment readiness and the information a warehouse needs before arrival",
    evidence: [
      "Inbound planning should identify the expected arrival, freight profile and receiving requirements.",
      "Appointment details and shipment references need to match the receiving instructions.",
      "Missing or conflicting information should be resolved before the freight reaches the receiving point.",
    ],
  },
  {
    id: "inventory-status",
    area: "inventory status definitions for available, held, damaged and pending-review stock",
    evidence: [
      "Inventory status should show whether stock is available, held, damaged or awaiting a decision.",
      "Status changes need a clear reason and an identified approval owner.",
      "Physical handling and system records should be reconciled before stock is released.",
    ],
  },
  {
    id: "outbound-readiness",
    area: "outbound order readiness before carrier pickup",
    evidence: [
      "Outbound instructions should identify the order, quantity, packaging and destination requirements.",
      "Pickup timing should be coordinated with the warehouse completion status.",
      "Unresolved quantity, label or packaging exceptions should be escalated before release.",
    ],
  },
  {
    id: "carrier-handoffs",
    area: "documenting carrier handoffs from pickup through delivery confirmation",
    evidence: [
      "A transportation handoff should identify the shipment, pickup status and next responsible party.",
      "Delivery instructions and known exceptions should travel with the shipment record.",
      "Proof of delivery closes the handoff and supports follow-up when an exception remains.",
    ],
  },
  {
    id: "inventory-reconciliation",
    area: "cycle counts and inventory reconciliation without disrupting daily fulfillment",
    evidence: [
      "Count plans should define the items, locations and inventory statuses included in the review.",
      "Differences need to be documented and investigated before records are adjusted.",
      "Reconciliation should preserve a clear link between the physical count and the approved system change.",
    ],
  },
  {
    id: "warehouse-onboarding",
    area: "onboarding a new warehouse account with clear operating responsibilities",
    evidence: [
      "Onboarding should confirm the freight profile, expected activity and required handling instructions.",
      "The client and warehouse need named owners for routine decisions and exceptions.",
      "The operating plan should be reviewed when actual volume or handling differs from the original assumptions.",
    ],
  },
  {
    id: "capacity-changes",
    area: "adjusting warehouse capacity when inbound or outbound volume changes",
    evidence: [
      "Capacity planning depends on expected inventory, activity and timing rather than storage volume alone.",
      "Short-term volume changes should be communicated before they affect receiving or order preparation.",
      "The operating plan should identify which work can be rescheduled and which deadlines require escalation.",
    ],
  },
  {
    id: "multi-location-transfers",
    area: "controlling inventory transfers between warehouse locations",
    evidence: [
      "A transfer instruction should identify the item, quantity, origin and destination.",
      "Inventory status should remain visible while goods are moving between locations.",
      "Receipt confirmation and discrepancy handling complete the transfer record.",
    ],
  },
];
const requestedTopic = process.env.ARTICLE_TOPIC?.trim();

let approvedSources = [];
if (process.env.ARTICLE_SOURCES_JSON?.trim()) {
  approvedSources = JSON.parse(process.env.ARTICLE_SOURCES_JSON);
  if (!Array.isArray(approvedSources) || approvedSources.some((item) => typeof item?.name !== "string" || !/^https:\/\//.test(item?.url))) {
    throw new Error("ARTICLE_SOURCES_JSON must be an array of {name, url} objects using HTTPS URLs.");
  }
}

const systemPrompt = `You are an editorial assistant for Runex Logistics Inc. Write people-first English guidance for businesses planning Canadian warehousing, fulfillment and freight workflows. Use only the operational evidence and approved sources supplied in the brief. Never invent first-hand experience, customers, results, statistics, legal requirements, certifications, prices, locations, capabilities or delivery guarantees. Treat examples explicitly as hypothetical. Avoid hype, filler, keyword stuffing and formulaic AI phrases. Return valid JSON only.`;

const editorialBriefs = briefs.map((brief) => `- briefId: ${brief.id}\n  Area: ${brief.area}\n  Allowed operational evidence:\n${brief.evidence.map((item) => `  - ${item}`).join("\n")}`).join("\n");

const userPrompt = `Create one original article${requestedTopic ? ` about this requested topic: ${requestedTopic}` : " by choosing a narrow, practical search intent that is not already covered below"}.

Choose exactly one editorial brief and use only that brief's operational evidence. Select a materially new decision, workflow, handoff, documentation or exception-management angle rather than paraphrasing an existing article.

Editorial briefs:
${editorialBriefs}

Approved external sources (use only these; an empty list means do not make external factual or regulatory claims):
${approvedSources.length ? approvedSources.map((item) => `- ${item.name}: ${item.url}`).join("\n") : "- None"}

Existing titles that must not be repeated or closely paraphrased:
${existingTitles.map((title) => `- ${title}`).join("\n")}

Requirements:
- Answer one clear search intent with the amount of detail the subject needs. Do not target a word count and do not pad the article.
- Give practical operational guidance, trade-offs, decision points, limitations and questions a buyer should ask.
- Do not give legal, customs, tax or regulatory advice.
- Use 3-6 descriptive sections with 1-3 substantial paragraphs each. Bullets are optional.
- FAQs are optional; include 0-3 only when they add information not already covered.
- Use Canadian context only where supported by the brief. Do not imply nationwide facilities or coverage details.
- Title, description and excerpt must be complete, natural sentences or phrases rather than keyword templates.
- Provide 3-6 natural topic phrases in keywords; these are editorial labels, not HTML meta keywords.
- keyAnswer must directly answer the topic in 2-3 self-contained sentences.
- operationalBasis must reproduce at least two supplied evidence statements exactly.
- sources must contain only approved source objects above. If there are no approved sources, return an empty array.
- Do not use Markdown, HTML or emoji.

Return exactly this JSON shape:
{
  "briefId": "one of the supplied briefId values",
  "category": "one of: 3PL & Warehousing, FBA & E-commerce, Distribution, Fulfillment, Supply Chain",
  "title": "...",
  "description": "...",
  "excerpt": "...",
  "keywords": ["..."],
  "keyAnswer": "...",
  "operationalBasis": ["exact supplied evidence statement"],
  "sources": [{ "name": "approved source name", "url": "approved source URL" }],
  "sections": [{ "heading": "...", "paragraphs": ["..."], "bullets": ["..."] }],
  "faq": [{ "question": "...", "answer": "..." }]
}`;

const countWords = (value) => value.trim().split(/\s+/).filter(Boolean).length;
const normalizeWords = (value) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 2);
const jaccard = (left, right) => {
  const a = new Set(normalizeWords(left));
  const b = new Set(normalizeWords(right));
  const intersection = [...a].filter((item) => b.has(item)).length;
  return intersection / Math.max(1, new Set([...a, ...b]).size);
};
const copiedShingleRatio = (value, size = 7) => {
  const words = normalizeWords(value);
  const shingles = Array.from({ length: Math.max(0, words.length - size + 1) }, (_, index) => words.slice(index, index + size).join(" "));
  return shingles.filter((shingle) => source.toLowerCase().includes(shingle)).length / Math.max(1, shingles.length);
};
const requireString = (value, field, min = 1) => {
  if (typeof value !== "string" || value.trim().length < min) throw new Error(`Invalid ${field}.`);
  return value.trim();
};

async function requestArticleContent(messages) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, thinking: { type: "disabled" }, response_format: { type: "json_object" }, max_tokens: 8_000, temperature: 0.35, stream: false }),
  });
  if (!response.ok) throw new Error(`DeepSeek request failed (${response.status}): ${(await response.text()).slice(0, 1_000)}`);
  const rawContent = (await response.json())?.choices?.[0]?.message?.content;
  if (typeof rawContent !== "string" || !rawContent.trim()) throw new Error("DeepSeek returned no article content.");
  return rawContent;
}

function parseArticleContent(rawContent) {
  try {
    return JSON.parse(rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  } catch (error) {
    throw new Error(`DeepSeek returned invalid JSON: ${error.message}`);
  }
}

function slugifyTitle(title) {
  return title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
}

function validateGeneratedArticle(generated) {
  const briefId = requireString(generated.briefId, "briefId");
  const selectedBrief = briefs.find((brief) => brief.id === briefId);
  if (!selectedBrief) throw new Error(`Brief "${briefId}" is not allowed. Choose one supplied briefId.`);

  const title = requireString(generated.title, "title", 20);
  if (title.length > 90) throw new Error(`Title is too long (${title.length} characters). Keep it at 90 characters or fewer.`);
  const titleCollision = existingTitles
    .map((existing) => ({ existing, score: jaccard(existing, title) }))
    .sort((left, right) => right.score - left.score)[0];
  if (titleCollision && (titleCollision.existing.toLowerCase() === title.toLowerCase() || titleCollision.score > 0.58)) {
    throw new Error(`Title "${title}" is too similar to existing title "${titleCollision.existing}". Choose a materially different search intent, preferably from another editorial brief.`);
  }
  const slug = slugifyTitle(title);
  if (!slug) throw new Error(`Title "${title}" cannot produce a valid URL slug. Use a clear English title.`);
  if (existingSlugs.includes(slug)) throw new Error(`Title "${title}" produces an existing URL slug "${slug}". Choose a different search intent and title.`);

  const categories = new Set(["3PL & Warehousing", "FBA & E-commerce", "Distribution", "Fulfillment", "Supply Chain"]);
  if (!categories.has(generated.category)) throw new Error("Category is not allowed.");
  if (!Array.isArray(generated.sections) || generated.sections.length < 3 || generated.sections.length > 6) throw new Error("Article must contain 3-6 useful sections.");
  if (!Array.isArray(generated.faq) || generated.faq.length > 3) throw new Error("FAQ must contain 0-3 items.");
  if (!Array.isArray(generated.keywords) || generated.keywords.length < 3 || generated.keywords.length > 6) throw new Error("Keywords must contain 3-6 items.");

  const sections = generated.sections.map((section, index) => {
    const heading = requireString(section.heading, `section ${index + 1} heading`, 5);
    if (heading.length > 90) throw new Error(`Section ${index + 1} heading is too long.`);
    if (!Array.isArray(section.paragraphs) || section.paragraphs.length < 1 || section.paragraphs.length > 3) throw new Error(`Section ${index + 1} needs 1-3 paragraphs.`);
    const normalized = { heading, paragraphs: section.paragraphs.map((item, itemIndex) => requireString(item, `section ${index + 1} paragraph ${itemIndex + 1}`, 40)) };
    if (Array.isArray(section.bullets) && section.bullets.length) normalized.bullets = section.bullets.map((item, itemIndex) => requireString(item, `section ${index + 1} bullet ${itemIndex + 1}`, 10));
    return normalized;
  });
  const faq = generated.faq.map((item, index) => ({ question: requireString(item.question, `FAQ ${index + 1} question`, 10), answer: requireString(item.answer, `FAQ ${index + 1} answer`, 30) }));
  const keywords = [...new Set(generated.keywords.map((item, index) => requireString(item, `keyword ${index + 1}`, 4)))];
  if (keywords.length < 3) throw new Error("Keywords must be unique.");

  const keyAnswer = requireString(generated.keyAnswer, "keyAnswer", 60);
  const prose = [keyAnswer, ...sections.flatMap((section) => [...section.paragraphs, ...(section.bullets || [])]), ...faq.map((item) => item.answer)].join(" ");
  const wordCount = countWords(prose);
  if (wordCount < 450 || wordCount > 1_400) throw new Error(`Article is incomplete or unfocused (${wordCount} words).`);
  if (copiedShingleRatio(prose) > 0.035) throw new Error("Article overlaps too heavily with existing site copy.");

  const unsupportedPatterns = [
    /\b(in (my|our) experience|we have (seen|found|helped)|our clients?|customer results?)\b/i,
    /\b(guarantee[sd]?|always|never fails?|eliminates? (all|the)?)\b/i,
    /\b\d+(?:\.\d+)?\s*%\b/,
    /\b(studies show|research proves|industry data shows)\b/i,
  ];
  if (unsupportedPatterns.some((pattern) => pattern.test(prose))) throw new Error("Article contains an unsupported experience, result, statistic or absolute claim.");
  if (!approvedSources.length && /\b(customs|tariff|tax law|regulation|statutory|legally required)\b/i.test(prose)) throw new Error("External or regulatory claim requires an approved source.");

  if (!Array.isArray(generated.operationalBasis) || generated.operationalBasis.length < 2 || generated.operationalBasis.some((item) => !selectedBrief.evidence.includes(item))) {
    throw new Error("Operational basis must reproduce at least two supplied evidence statements exactly.");
  }
  if (!Array.isArray(generated.sources)) throw new Error("Sources must be an array.");
  const sources = generated.sources.map((item) => {
    const match = approvedSources.find((approved) => approved.name === item?.name && approved.url === item?.url);
    if (!match) throw new Error("Article introduced a source that was not approved.");
    return match;
  });

  const description = requireString(generated.description, "description", 70);
  if (description.length > 180) throw new Error("Description exceeds 180 characters.");
  const excerpt = requireString(generated.excerpt, "excerpt", 40);
  if (excerpt.length > 220) throw new Error("Excerpt exceeds 220 characters.");

  return {
    wordCount,
    article: {
      slug,
      category: generated.category,
      title,
      description,
      excerpt,
      keywords,
      publishedAt,
      modifiedAt: publishedAt,
      readTime: `${Math.max(3, Math.ceil(wordCount / 220))} min read`,
      qualityGatePassed: true,
      operationalBasis: [...new Set(generated.operationalBasis)],
      sources,
      keyAnswer,
      sections,
      faq,
    },
  };
}

const baseMessages = [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }];
const maxAttempts = 3;
let previousRawContent = "";
let lastError;
let validated;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const messages = [...baseMessages];
  if (attempt > 1) {
    if (previousRawContent) messages.push({ role: "assistant", content: previousRawContent });
    messages.push({ role: "user", content: `The prior draft failed this quality check: ${lastError.message}\nReturn a complete corrected JSON object. Do not loosen or work around the requirement.` });
  }
  try {
    console.log(`Generation attempt ${attempt}/${maxAttempts}.`);
    previousRawContent = await requestArticleContent(messages);
    validated = validateGeneratedArticle(parseArticleContent(previousRawContent));
    break;
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error));
    console.warn(`Attempt ${attempt} rejected: ${lastError.message}`);
  }
}

if (!validated) {
  throw new Error(`No article was published after ${maxAttempts} attempts. Last quality check: ${lastError.message}`);
}

const marker = "export const articles: Article[] = [";
if (!source.includes(marker)) throw new Error(`Could not find article list marker in ${articlesPath}.`);
const serialized = JSON.stringify(validated.article, null, 2).split("\n").map((line) => `  ${line}`).join("\n");
await writeFile(articlesPath, source.replace(marker, `${marker}\n${serialized},`), "utf8");
console.log(`Published candidate: ${validated.article.title} (${validated.wordCount} words).`);
