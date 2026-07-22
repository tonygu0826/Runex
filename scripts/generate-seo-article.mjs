import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const articlesPath = process.env.ARTICLES_PATH || path.join(root, "app", "insights", "articles.ts");
const apiUrl = `${(process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com").replace(/\/$/, "")}/chat/completions`;
const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  throw new Error("DEEPSEEK_API_KEY is missing. Add it in GitHub Settings > Secrets and variables > Actions.");
}

const source = await readFile(articlesPath, "utf8");
const existingSlugs = [...source.matchAll(/["']?slug["']?\s*:\s*["']([^"']+)["']/g)].map((match) => match[1]);
const existingTitles = [...source.matchAll(/["']?title["']?\s*:\s*["']([^"']+)["']/g)].map((match) => match[1]);
const publishedAt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const topics = [
  "reducing receiving delays at a Canadian 3PL warehouse",
  "inventory cycle counting for growing e-commerce brands",
  "how cross-docking supports faster Canadian distribution",
  "preparing retail-compliant shipments without avoidable rework",
  "choosing between pallet storage and shelf storage",
  "building a practical reverse-logistics process in Canada",
  "how warehouse appointment planning prevents detention",
  "what importers should prepare before freight reaches a 3PL",
  "using kitting and light assembly to simplify fulfillment",
  "peak-season warehouse planning for Canadian businesses",
  "how exception reporting improves inventory accuracy",
  "coordinating warehousing and final-mile delivery",
  "when transloading is useful for Canadian freight",
  "designing a reliable B2B order-fulfillment workflow",
  "common causes of warehouse inventory discrepancies",
  "how product labeling affects fulfillment efficiency",
  "planning overflow storage without losing inventory visibility",
  "questions to ask before switching 3PL providers",
  "how shipment consolidation can reduce handling complexity",
  "building a clear warehouse returns disposition process",
  "how carton and pallet standards affect outbound operations",
  "warehouse readiness for marketplace and retail replenishment",
  "how inbound documentation supports faster receiving",
  "evaluating value-added warehouse services in Canada",
];

const dayNumber = Math.floor(new Date(`${publishedAt}T12:00:00-04:00`).getTime() / 86_400_000);
const selectedTopic = process.env.ARTICLE_TOPIC?.trim() || topics[dayNumber % topics.length];

const systemPrompt = `You are the senior human content editor for Runex Logistics Inc., a Canadian 3PL and warehousing company. Write useful, people-first English content for importers, distributors, retailers and e-commerce operators. Sound like an experienced logistics operator explaining the issue to a client: vary sentence length, use concrete transitions, acknowledge trade-offs and avoid formulaic phrasing. Never invent company capabilities, customer results, prices, legal requirements, statistics, certifications or delivery guarantees. Avoid hype, keyword stuffing, repetitive conclusions and generic AI phrases such as "in today's fast-paced world", "delve", "game-changer", "unlock", "navigate the complexities" and "it is important to note". Return valid JSON only.`;

const userPrompt = `Create one original evergreen SEO article about: ${selectedTopic}.

Existing titles that must not be repeated or closely paraphrased:
${existingTitles.map((title) => `- ${title}`).join("\n")}

Requirements:
- Audience: businesses needing Canadian warehousing, fulfillment, distribution or value-added logistics services.
- Aim for 800 to 1,100 English words. Do not add filler to reach a word count.
- Give practical operational guidance, not legal, customs, tax or regulatory advice.
- Use Canadian context naturally, without unsupported claims.
- Never invent statistics, percentages, deadlines, legal requirements, geographic disruptions, company capabilities or operational rules. Frame hypothetical examples clearly as examples.
- Title: descriptive and specific, 45-60 characters, no more than 10 words, not clickbait.
- Section headings: concise, no more than 60 characters and no more than 10 words.
- Meta description: one complete, useful sentence of 110-160 characters. Do not cut a sentence to fit.
- Slug: concise lowercase kebab-case, no more than 72 characters.
- SEO: satisfy one clear primary search intent, use descriptive headings and natural terminology, and never repeat a phrase unnaturally.
- Provide 4-6 natural topic phrases in keywords. They are editorial signals for the AI information file, not HTML meta keywords.
- GEO: include a self-contained 2-3 sentence keyAnswer that directly answers the search question, define important terms in plain language and make each section understandable when quoted independently by an AI answer engine.
- E-E-A-T signals: explain practical decisions, limitations, exception handling and questions a buyer should ask. Do not claim first-hand results or credentials that were not supplied.
- Write with a recognizably human editorial rhythm. Mix concise and longer sentences, use practical examples framed as possibilities rather than invented case studies, and avoid identical section structures.
- Include a direct 2-3 sentence keyAnswer suitable for featured snippets and AI-generated answers.
- Include 5-6 sections. Each section needs 1-3 substantial paragraphs; up to three sections may also include 3-5 bullets.
- Include exactly 3 useful FAQs with concise answers.
- Do not use Markdown, HTML, citations, URLs or emoji.
- Do not mention that the article was generated by AI.

Return exactly this JSON shape:
{
  "slug": "lowercase-kebab-case",
  "category": "one of: 3PL & Warehousing, FBA & E-commerce, Distribution, Fulfillment, Supply Chain",
  "title": "...",
  "description": "...",
  "excerpt": "one concise sentence, no more than 180 characters",
  "keywords": ["4-6 natural search phrases"],
  "keyAnswer": "...",
  "sections": [
    { "heading": "...", "paragraphs": ["..."], "bullets": ["..."] }
  ],
  "faq": [
    { "question": "...", "answer": "..." }
  ]
}`;

const response = await fetch(apiUrl, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    thinking: { type: "disabled" },
    response_format: { type: "json_object" },
    max_tokens: 8_000,
    temperature: 0.45,
    stream: false,
  }),
});

if (!response.ok) {
  const detail = await response.text();
  throw new Error(`DeepSeek request failed (${response.status}): ${detail.slice(0, 1_000)}`);
}

const payload = await response.json();
const rawContent = payload?.choices?.[0]?.message?.content;
if (typeof rawContent !== "string" || !rawContent.trim()) {
  throw new Error("DeepSeek returned no article content.");
}

let generated;
try {
  generated = JSON.parse(rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
} catch (error) {
  throw new Error(`DeepSeek returned invalid JSON: ${error.message}`);
}

const countWords = (value) => value.trim().split(/\s+/).filter(Boolean).length;

const requireString = (value, field, min = 1) => {
  if (typeof value !== "string" || value.trim().length < min) {
    throw new Error(`Generated article has an invalid ${field}.`);
  }
  return value.trim();
};

const slug = requireString(generated.slug, "slug").toLowerCase();
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Generated slug is not lowercase kebab-case.");
if (slug.length > 72) throw new Error("Generated slug exceeds 72 characters.");
if (existingSlugs.includes(slug)) throw new Error(`Generated slug already exists: ${slug}`);

const title = requireString(generated.title, "title", 20);
if (title.length > 60 || countWords(title) > 10) {
  throw new Error("Generated title must be no more than 60 characters and 10 words.");
}
if (existingTitles.some((existing) => existing.toLowerCase() === title.toLowerCase())) {
  throw new Error(`Generated title already exists: ${title}`);
}

const categories = new Set(["3PL & Warehousing", "FBA & E-commerce", "Distribution", "Fulfillment", "Supply Chain"]);
if (!categories.has(generated.category)) throw new Error(`Generated category is not allowed: ${generated.category}`);
if (!Array.isArray(generated.sections) || generated.sections.length < 5 || generated.sections.length > 6) {
  throw new Error("Generated article must contain 5-6 sections.");
}
if (!Array.isArray(generated.keywords) || generated.keywords.length < 4 || generated.keywords.length > 6) {
  throw new Error("Generated article must contain 4-6 natural topic phrases.");
}
if (!Array.isArray(generated.faq) || generated.faq.length !== 3) {
  throw new Error("Generated article must contain exactly 3 FAQs.");
}

const sections = generated.sections.map((section, index) => {
  if (!Array.isArray(section.paragraphs) || section.paragraphs.length < 1) {
    throw new Error(`Section ${index + 1} has no paragraphs.`);
  }
  const heading = requireString(section.heading, `section ${index + 1} heading`, 5);
  if (heading.length > 60 || countWords(heading) > 10) {
    throw new Error(`Section ${index + 1} heading must be no more than 60 characters and 10 words.`);
  }
  const normalized = {
    heading,
    paragraphs: section.paragraphs.map((paragraph, paragraphIndex) =>
      requireString(paragraph, `section ${index + 1} paragraph ${paragraphIndex + 1}`, 12),
    ),
  };
  if (Array.isArray(section.bullets) && section.bullets.length) {
    if (section.bullets.length < 3 || section.bullets.length > 5) {
      throw new Error(`Section ${index + 1} must contain 3-5 bullets when bullets are used.`);
    }
    normalized.bullets = section.bullets.map((bullet, bulletIndex) =>
      requireString(bullet, `section ${index + 1} bullet ${bulletIndex + 1}`, 8),
    );
  }
  return normalized;
});

const faq = generated.faq.map((item, index) => {
  const question = requireString(item.question, `FAQ ${index + 1} question`, 10);
  if (question.length > 90) throw new Error(`FAQ ${index + 1} question exceeds 90 characters.`);
  return {
    question,
    answer: requireString(item.answer, `FAQ ${index + 1} answer`, 30),
  };
});

const keywords = [...new Set(generated.keywords.map((keyword, index) => {
  const value = requireString(keyword, `keyword ${index + 1}`, 4);
  if (value.length > 55 || countWords(value) > 7) {
    throw new Error(`Keyword ${index + 1} must be no more than 55 characters and 7 words.`);
  }
  return value;
}))];
if (keywords.length < 4) throw new Error("Generated keywords must be unique.");

const prose = [generated.keyAnswer, ...sections.flatMap((section) => section.paragraphs), ...faq.map((item) => item.answer)].join(" ");
const wordCount = countWords(prose);
if (wordCount < 750 || wordCount > 1_200) {
  throw new Error(`Generated article must be 750-1,200 words; received ${wordCount}.`);
}

const description = requireString(generated.description, "description", 110);
if (description.length > 160) throw new Error("Generated description exceeds 160 characters.");
const excerpt = requireString(generated.excerpt, "excerpt", 40);
if (excerpt.length > 180) throw new Error("Generated excerpt exceeds 180 characters.");
const keyAnswer = requireString(generated.keyAnswer, "keyAnswer", 80);
if (countWords(keyAnswer) > 100) throw new Error("Generated key answer exceeds 100 words.");

const article = {
  slug,
  category: generated.category,
  title,
  description,
  excerpt,
  keywords,
  publishedAt,
  readTime: `${Math.max(4, Math.ceil(wordCount / 220))} min read`,
  keyAnswer,
  sections,
  faq,
};

const marker = "export const articles: Article[] = [";
if (!source.includes(marker)) throw new Error(`Could not find article list marker in ${articlesPath}.`);

const serialized = JSON.stringify(article, null, 2)
  .split("\n")
  .map((line) => `  ${line}`)
  .join("\n");
const updated = source.replace(marker, `${marker}\n${serialized},`);
await writeFile(articlesPath, updated, "utf8");

console.log(`Generated: ${article.title}`);
console.log(`Slug: ${article.slug}`);
console.log(`Date: ${article.publishedAt}`);
console.log(`Approximate words: ${wordCount}`);
