import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deepSeekRequestSettings, requestDeepSeekContent, retryDelayForAttempt, waitBeforeRetry } from "./deepseek-client.mjs";
import {
  formatExistingCoverage,
  qualityFailureAction,
  retryInstruction,
  selectableBriefsForAttempt,
  seoGenerationSettings,
} from "./seo-generation-policy.mjs";
import { extractExistingArticleSignals, findTopicCollision, jaccard, normalizeWords, slugifyTitle } from "./seo-quality.mjs";
import { editorialBriefs } from "./seo-editorial-briefs.mjs";
import { applyFieldRepairs, articleFieldProblems, ArticleFieldRepairError, buildFieldRepairPrompt } from "./seo-field-repairs.mjs";
import {
  assertDraftFollowsPlan, assertSupportedWording, buildTopicPlanningPrompt,
  GENERATION_BUDGET_MS, rotateBriefs, unusedEditorialBriefs, validateTopicPlan,
} from "./seo-topic-planner.mjs";

export async function generateSeoArticle({
  env = process.env,
  briefs = editorialBriefs,
  readSource = readFile,
  writeSource = writeFile,
  requestContent = requestDeepSeekContent,
  wait = waitBeforeRetry,
  logger = console,
  now = Date.now,
} = {}) {
  const deadline = now() + GENERATION_BUDGET_MS;

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const articlesPath = env.ARTICLES_PATH || path.join(root, "app", "insights", "articles.ts");
  const apiUrl = `${(env.DEEPSEEK_API_BASE || "https://api.deepseek.com").replace(/\/$/, "")}/chat/completions`;
  const model = env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const apiKey = env.DEEPSEEK_API_KEY;
  const { timeoutMs: requestTimeoutMs, retryDelayMs } = deepSeekRequestSettings(env);
  const { maxAttempts } = seoGenerationSettings(env);

  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is missing.");

  const source = await readSource(articlesPath, "utf8");
  const marker = "export const articles: Article[] = [";
  if (!source.includes(marker)) throw new Error(`Could not find article list marker in ${articlesPath}.`);
  const existingArticles = extractExistingArticleSignals(source);
  const existingSlugs = existingArticles.map((article) => article.slug);
  const existingTitles = existingArticles.map((article) => article.title);
  const publishedAt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now()));

  const requestedTopic = env.ARTICLE_TOPIC?.trim();
  const selectableBriefs = rotateBriefs(unusedEditorialBriefs(briefs, existingArticles), env.GITHUB_RUN_NUMBER);
  if (!selectableBriefs.length) {
    throw new Error("No unused editorial briefs remain. Add distinct reader questions and grounded operational evidence; no article was written.");
  }
  logger.log(`Editorial coverage: ${briefs.length - selectableBriefs.length} consumed brief(s), ${selectableBriefs.length} unused.`);
  if (selectableBriefs.length < 7) logger.warn(`::warning::Editorial pool is low: ${selectableBriefs.length} unused brief(s); review and add new reader questions soon.`);

  let approvedSources = [];
  if (env.ARTICLE_SOURCES_JSON?.trim()) {
    approvedSources = JSON.parse(env.ARTICLE_SOURCES_JSON);
    if (!Array.isArray(approvedSources) || approvedSources.some((item) => typeof item?.name !== "string" || !/^https:\/\//.test(item?.url))) {
      throw new Error("ARTICLE_SOURCES_JSON must be an array of {name, url} objects using HTTPS URLs.");
    }
  }

  const systemPrompt = `You are an editorial assistant for Runex Logistics Inc. Write people-first English guidance for businesses planning Canadian warehousing, fulfillment and freight workflows. Use only the operational evidence and approved sources supplied in the brief. Never invent first-hand experience, customers, results, statistics, legal requirements, certifications, prices, locations, capabilities or delivery guarantees. Treat examples explicitly as hypothetical. Avoid hype, filler, keyword stuffing and formulaic AI phrases. Return valid JSON only.`;

  function buildUserPrompt(attemptBriefs, plan) {
    const editorialBriefs = attemptBriefs.map((brief) => `- briefId: ${brief.id}\n  Area: ${brief.area}\n  Allowed operational evidence:\n${brief.evidence.map((item) => `  - ${item}`).join("\n")}`).join("\n");

    return `WRITE_ARTICLE: Write the article for this already validated topic plan. Copy briefId and title exactly; keep all prose focused on its reader question, answer and outline.
  Approved plan:
  ${JSON.stringify(plan, null, 2)}
  ${requestedTopic ? `Requested topic: ${requestedTopic}` : ""}

  Use only the approved plan's brief and operational evidence. Do not switch topics during writing or turn a narrow question into a generic overview.

  Editorial briefs:
  ${editorialBriefs}

  Approved external sources (use only these; an empty list means do not make external factual or regulatory claims):
  ${approvedSources.length ? approvedSources.map((item) => `- ${item.name}: ${item.url}`).join("\n") : "- None"}

  Existing coverage that must not be repeated or closely paraphrased:
  ${formatExistingCoverage(existingArticles)}

  Requirements:
  - Answer the approved search intent with useful detail (the quality gate requires 450-1,400 words of prose). Do not pad the article.
  - Give practical operational guidance, trade-offs, decision points, limitations and questions a buyer should ask.
  - Do not give legal, customs, tax or regulatory advice.
  - Use 3-6 descriptive sections with 1-3 substantial paragraphs each. Bullets are optional.
  - FAQs are optional; include 0-3 only when they add information not already covered.
  - Use Canadian context only where supported by the brief. Do not imply nationwide facilities or coverage details.
  - Copy the approved title exactly; it has already been checked against the 90-character limit.
  - Description must be a complete, natural sentence between 70 and 160 characters.
  - Excerpt must be complete and between 40 and 200 characters.
  - Provide 3-6 natural topic phrases in keywords; these are editorial labels, not HTML meta keywords.
  - keyAnswer must directly answer the topic in 2-3 self-contained sentences.
  - operationalBasis must reproduce at least two supplied evidence statements exactly.
  - sources must contain only approved source objects above. If there are no approved sources, return an empty array.
  - Do not use first-hand experience or customer-result wording such as "in our experience", "we have seen", "our clients" or "customer results".
  - Do not use guarantees, percentages, unsupported studies or absolute wording such as "always", "never fails" or "eliminates all".
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
  }

  const countWords = (value) => value.trim().split(/\s+/).filter(Boolean).length;
  const normalizedSource = normalizeWords(source).join(" ");
  const copiedShingleRatio = (value, size = 7) => {
    const words = normalizeWords(value);
    const shingles = Array.from({ length: Math.max(0, words.length - size + 1) }, (_, index) => words.slice(index, index + size).join(" "));
    return shingles.filter((shingle) => normalizedSource.includes(shingle)).length / Math.max(1, shingles.length);
  };
  const requireString = (value, field, min = 1) => {
    if (typeof value !== "string" || value.trim().length < min) throw new Error(`Invalid ${field}.`);
    return value.trim();
  };

  function parseArticleContent(rawContent) {
    try {
      return JSON.parse(rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
    } catch (error) {
      throw new Error(`DeepSeek returned invalid JSON: ${error.message}`);
    }
  }

  function validateGeneratedArticle(generated, allowedBriefs = briefs) {
    const briefId = requireString(generated.briefId, "briefId");
    const selectedBrief = allowedBriefs.find((brief) => brief.id === briefId);
    if (!selectedBrief) throw new Error(`Brief "${briefId}" is not allowed in this attempt. Choose one currently supplied briefId.`);

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

    assertSupportedWording([title, generated.description, generated.excerpt, ...keywords, prose, ...sections.map((section) => section.heading), ...faq.map((item) => item.question)].join(" "), approvedSources);

    if (!Array.isArray(generated.operationalBasis) || generated.operationalBasis.length < 2 || generated.operationalBasis.some((item) => !selectedBrief.evidence.includes(item))) {
      throw new Error("Operational basis must reproduce at least two supplied evidence statements exactly.");
    }
    const operationalBasis = [...new Set(generated.operationalBasis)];
    if (operationalBasis.length < 2) throw new Error("Operational basis needs at least two distinct supplied statements.");
    if (!Array.isArray(generated.sources)) throw new Error("Sources must be an array.");
    const sources = generated.sources.map((item) => {
      const match = approvedSources.find((approved) => approved.name === item?.name && approved.url === item?.url);
      if (!match) throw new Error("Article introduced a source that was not approved.");
      return match;
    });

    const description = requireString(generated.description, "description", 70);
    if (description.length > 180) throw new Error(`Description is ${description.length} characters; shorten it to 180 characters or fewer while keeping it complete.`);
    const excerpt = requireString(generated.excerpt, "excerpt", 40);
    if (excerpt.length > 220) throw new Error(`Excerpt is ${excerpt.length} characters; shorten it to 220 characters or fewer while keeping it complete.`);

    const topicCollision = findTopicCollision(
      { briefId, title, description, excerpt, keywords, keyAnswer, operationalBasis },
      existingArticles,
    );
    if (topicCollision) {
      throw new Error(
        `Topic overlaps with existing article "${topicCollision.existing.title}": ${topicCollision.reason}. Choose another editorial brief or a materially different search intent.`,
      );
    }

    return {
      wordCount,
      article: {
        briefId,
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
        operationalBasis,
        sources,
        keyAnswer,
        sections,
        faq,
      },
    };
  }

  let previousRawContent = "";
  let lastError;
  let validated;
  let plan;
  let fieldRepair;
  let retryAction = "fresh-draft";
  let retryPhase = "";
  let failedBriefId = "";
  let requests = 0;
  const blockedBriefIds = new Set();

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const phase = fieldRepair ? "repair" : plan ? "draft" : "plan";
    const eligibleBriefs = selectableBriefsForAttempt({ briefs: selectableBriefs, blockedBriefIds });
    const attemptBriefs = requestedTopic ? eligibleBriefs : eligibleBriefs.slice(0, 6);
    if (!attemptBriefs.length) {
      lastError = new Error("Every unused editorial brief was rejected. Add genuinely new editorial input; do not recycle covered briefs.");
      break;
    }
    if (!plan && attempt === maxAttempts) {
      lastError = new Error(`No request budget remains for both a new plan and a validated article. Last check: ${lastError?.message || "none"}`);
      break;
    }
    const remainingMs = deadline - now();
    if (remainingMs <= 0) {
      lastError = new Error("The 14-minute generation budget is exhausted; leaving time for build and publication steps.");
      break;
    }
    const prompt = fieldRepair
      ? buildFieldRepairPrompt({ plan, brief: briefs.find((brief) => brief.id === plan.briefId), problems: fieldRepair.problems, approvedSources })
      : plan
      ? buildUserPrompt(briefs.filter((brief) => brief.id === plan.briefId), plan)
      : buildTopicPlanningPrompt({ briefs: attemptBriefs, existingArticles, requestedTopic });
    const messages = [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }];
    if (lastError) {
      if (fieldRepair) {
        messages.push({ role: "user", content: `Last validation error: ${lastError.message}\nReturn only the requested field replacements. Every replacement will be checked; do not return the complete article.` });
      } else {
        if (retryPhase === phase && retryAction === "repair-draft" && previousRawContent) messages.push({ role: "assistant", content: previousRawContent });
        messages.push({ role: "user", content: retryInstruction({ action: retryAction, errorMessage: lastError.message, failedBriefId }) });
        if (phase === "plan") messages.push({ role: "user", content: "Return only a corrected topic plan with an outline, not an article." });
      }
    }
    let generated;
    try {
      requests += 1;
      logger.log(`${phase === "plan" ? "Topic planning" : phase === "repair" ? "Targeted field repair" : "Article writing"} request ${requests}/${maxAttempts}.`);
      previousRawContent = await requestContent({
        apiUrl, apiKey, model, messages,
        timeoutMs: Math.min(requestTimeoutMs, 120_000, remainingMs),
        maxTokens: phase === "plan" ? 2_000 : 8_000,
      });
      const response = parseArticleContent(previousRawContent);
      generated = fieldRepair ? applyFieldRepairs(fieldRepair.article, fieldRepair.problems, response) : response;
      if (!plan) {
        if (generated?.unavailable) throw new Error(`No supported topic plan: ${String(generated.reason || "requested topic is outside the supplied briefs")}`);
        plan = validateTopicPlan(generated, attemptBriefs, existingArticles, approvedSources);
        logger.log(`Topic approved before drafting: ${plan.briefId} — ${plan.title}`);
        previousRawContent = "";
        lastError = undefined;
        continue;
      }
      assertDraftFollowsPlan(generated, plan);
      const problems = articleFieldProblems(generated, approvedSources);
      if (problems.length) throw new ArticleFieldRepairError(problems);
      validated = validateGeneratedArticle(generated, briefs.filter((brief) => brief.id === plan.briefId));
      validated.article.searchIntent = plan.searchIntent;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      failedBriefId = plan?.briefId || (typeof generated?.briefId === "string" ? generated.briefId : "");
      retryAction = qualityFailureAction(lastError.message);
      retryPhase = phase;
      if (lastError instanceof ArticleFieldRepairError) {
        fieldRepair = { article: generated, problems: lastError.problems };
      } else if (phase === "repair" && generated) {
        // The patch was valid but another whole-article gate failed. Keep the
        // patched draft for a full correction, or discard it for a new topic.
        fieldRepair = undefined;
        previousRawContent = JSON.stringify(generated);
        retryPhase = "draft";
      }
      if (retryAction === "switch-brief" && failedBriefId) {
        blockedBriefIds.add(failedBriefId);
        plan = undefined;
        fieldRepair = undefined;
        previousRawContent = "";
      }
      logger.warn(`${phase} request ${requests} rejected: ${lastError.message}`);
      const delayMs = retryDelayForAttempt(attempt, retryDelayMs);
      if (attempt < maxAttempts && now() + delayMs < deadline) {
        logger.warn(`Retrying in ${delayMs} ms.`);
        await wait(attempt, retryDelayMs);
      }
    }
  }

  if (!validated) {
    throw new Error(`No article was published after ${requests} API requests (planning and writing share a ${maxAttempts}-request limit). Last quality check: ${lastError?.message || "no validated draft"}`);
  }

  if (await readSource(articlesPath, "utf8") !== source) throw new Error("Article source changed during generation; refusing to overwrite newer content.");
  const serialized = JSON.stringify(validated.article, null, 2).split("\n").map((line) => `  ${line}`).join("\n");
  await writeSource(articlesPath, source.replace(marker, `${marker}\n${serialized},`), "utf8");
  logger.log(`Validated article written for build and publication: ${validated.article.title} (${validated.wordCount} words).`);
  return validated;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateSeoArticle();
}
