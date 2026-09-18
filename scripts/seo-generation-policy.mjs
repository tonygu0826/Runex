const DEFAULT_MAX_ATTEMPTS = 6;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function seoGenerationSettings(env = process.env) {
  return {
    maxAttempts: Math.min(8, positiveInteger(env.SEO_GENERATION_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS)),
  };
}

export function formatExistingCoverage(existingArticles) {
  if (!existingArticles.length) return "- None";

  return existingArticles
    .map((article) => {
      const brief = article.briefId ? `briefId: ${article.briefId}; ` : "";
      const keywords = article.keywords?.length ? `; keywords: ${article.keywords.join(", ")}` : "";
      const intent = article.searchIntent || article.keyAnswer;
      const answer = intent ? `; intent: ${intent}` : "";
      const basis = article.operationalBasis?.length ? `; basis: ${article.operationalBasis.join(" | ")}` : "";
      return `- ${brief}title: ${article.title}${keywords}${answer}${basis}`;
    })
    .join("\n");
}

export function qualityFailureAction(message) {
  const value = String(message ?? "");
  if (
    /topic overlaps with existing article/i.test(value) ||
    /overlaps too heavily with existing site copy/i.test(value) ||
    /too similar to existing title/i.test(value) ||
    /produces an existing URL slug/i.test(value)
  ) {
    return "switch-brief";
  }
  if (/DeepSeek request (?:failed|timed out)/i.test(value)) return "fresh-draft";
  return "repair-draft";
}

export function selectableBriefsForAttempt({ briefs, blockedBriefIds = new Set() }) {
  return briefs.filter((brief) => !blockedBriefIds.has(brief.id));
}

export function retryInstruction({ action, errorMessage, failedBriefId = "" }) {
  if (action === "switch-brief") {
    return [
      `The prior topic failed this quality check: ${errorMessage}`,
      failedBriefId ? `Do not use briefId "${failedBriefId}" again in this run.` : "Do not reuse the prior topic.",
      "Start a completely new article from one of the editorial briefs currently supplied. Do not paraphrase the rejected draft.",
    ].join("\n");
  }

  if (action === "fresh-draft") {
    return `The prior generation attempt failed before validation: ${errorMessage}\nStart again and return one complete JSON object.`;
  }

  return `The prior draft failed this quality check: ${errorMessage}\nReturn a complete corrected JSON object. Fix the stated problem directly and do not loosen or work around the requirement.`;
}
