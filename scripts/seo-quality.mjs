const slugStopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "before",
  "but",
  "by",
  "can",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "so",
  "that",
  "the",
  "their",
  "they",
  "these",
  "this",
  "those",
  "to",
  "what",
  "when",
  "why",
  "with",
  "without",
  "your",
]);

const comparisonStopWords = new Set([
  ...slugStopWords,
  "about",
  "after",
  "all",
  "does",
  "each",
  "keep",
  "make",
  "more",
  "not",
  "only",
  "over",
  "should",
  "than",
  "then",
  "through",
  "under",
  "using",
  "way",
  "which",
  "while",
]);

function stem(word) {
  if (word.length > 6 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 6 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 5 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 5 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

export function normalizeWords(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !comparisonStopWords.has(word))
    .map(stem);
}

export function jaccard(left, right) {
  const a = new Set(normalizeWords(left));
  const b = new Set(normalizeWords(right));
  const intersection = [...a].filter((item) => b.has(item)).length;
  return intersection / Math.max(1, new Set([...a, ...b]).size);
}

function overlapCoefficient(left, right) {
  const a = new Set(normalizeWords(left));
  const b = new Set(normalizeWords(right));
  const intersection = [...a].filter((item) => b.has(item)).length;
  return intersection / Math.max(1, Math.min(a.size, b.size));
}

export function slugifyTitle(title, maxLength = 64) {
  const allWords = String(title ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const meaningfulWords = allWords.filter((word) => !slugStopWords.has(word));
  const words = meaningfulWords.length >= 3 ? meaningfulWords : allWords;
  const selected = [];

  for (const word of words) {
    const candidate = [...selected, word].join("-");
    if (candidate.length > maxLength) continue;
    selected.push(word);
  }

  return selected.join("-");
}

function extractTopLevelObjects(source) {
  const marker = "export const articles: Article[] = [";
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return [];

  const objects = [];
  let objectStart = -1;
  let depth = 0;
  let quote = "";
  let escaped = false;

  const arrayStart = markerIndex + marker.length - 1;
  for (let index = arrayStart + 1; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "{") {
      if (depth === 0) objectStart = index;
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0 && objectStart >= 0) {
        objects.push(source.slice(objectStart, index + 1));
        objectStart = -1;
      }
    } else if (character === "]" && depth === 0) {
      break;
    }
  }

  return objects;
}

function decodeString(raw) {
  if (!raw) return "";
  if (raw.startsWith('"')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw.slice(1, -1);
    }
  }
  return raw.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
}

function extractStringProperty(block, property) {
  const pattern = new RegExp(`(?:^|\\n)\\s*["']?${property}["']?\\s*:\\s*("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`);
  return decodeString(block.match(pattern)?.[1]);
}

function extractStringArray(block, property) {
  const propertyPattern = new RegExp(`(?:^|\\n)\\s*["']?${property}["']?\\s*:\\s*\\[`);
  const match = propertyPattern.exec(block);
  if (!match) return [];

  const start = block.indexOf("[", match.index);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = start; index < block.length; index += 1) {
    const character = block[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "[") depth += 1;
    else if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        const arraySource = block.slice(start + 1, index);
        return [...arraySource.matchAll(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g)].map((item) => decodeString(item[0]));
      }
    }
  }
  return [];
}

export function extractExistingArticleSignals(source) {
  return extractTopLevelObjects(source)
    .map((block) => ({
      slug: extractStringProperty(block, "slug"),
      briefId: extractStringProperty(block, "briefId"),
      searchIntent: extractStringProperty(block, "searchIntent"),
      title: extractStringProperty(block, "title"),
      description: extractStringProperty(block, "description"),
      excerpt: extractStringProperty(block, "excerpt"),
      keywords: extractStringArray(block, "keywords"),
      operationalBasis: extractStringArray(block, "operationalBasis"),
      keyAnswer: extractStringProperty(block, "keyAnswer"),
    }))
    .filter((article) => article.slug && article.title);
}

function topicText(article) {
  return [article.title, article.description, article.excerpt, article.keyAnswer, ...(article.keywords || [])].filter(Boolean).join(" ");
}

export function findTopicCollision(candidate, existingArticles, recentLimit = 12) {
  const candidateEvidence = new Set(candidate.operationalBasis || []);
  let strongest = null;

  for (const [index, existing] of existingArticles.entries()) {
    const titleScore = jaccard(candidate.title, existing.title);
    const keywordScore = overlapCoefficient((candidate.keywords || []).join(" "), (existing.keywords || []).join(" "));
    const topicScore = jaccard(topicText(candidate), topicText(existing));
    const sharedEvidence = (existing.operationalBasis || []).filter((item) => candidateEvidence.has(item)).length;
    const sameRecentBrief = index < recentLimit && candidate.briefId && existing.briefId === candidate.briefId;
    const repeatedRecentEvidence = index < recentLimit && sharedEvidence >= 2;
    const archivedIntentOverlap = keywordScore >= 0.4 || topicScore >= 0.2 || titleScore >= 0.2;
    const sameArchivedBrief = index >= recentLimit && candidate.briefId && existing.briefId === candidate.briefId && archivedIntentOverlap;
    const repeatedArchivedEvidence = index >= recentLimit && sharedEvidence >= 2 && archivedIntentOverlap;
    const sameSearchIntent = candidate.searchIntent && existing.searchIntent && jaccard(candidate.searchIntent, existing.searchIntent) > 0.8;
    const isCollision =
      existing.title.toLowerCase() === candidate.title.toLowerCase() ||
      titleScore > 0.5 ||
      (titleScore > 0.32 && keywordScore >= 0.5) ||
      (topicScore > 0.55 && keywordScore >= 0.4) ||
      sameRecentBrief ||
      repeatedRecentEvidence ||
      sameSearchIntent ||
      sameArchivedBrief ||
      repeatedArchivedEvidence;

    if (!isCollision) continue;
    const sameBrief = sameRecentBrief || sameArchivedBrief;
    const repeatedEvidence = repeatedRecentEvidence || repeatedArchivedEvidence;
    const rank = Number(sameBrief) * 4 + sharedEvidence + titleScore + topicScore + keywordScore;
    if (!strongest || rank > strongest.rank) {
      strongest = {
        existing,
        rank,
        titleScore,
        keywordScore,
        topicScore,
        sharedEvidence,
        reason: sameBrief
          ? "the same editorial brief and search intent were already used"
          : repeatedEvidence
            ? "the same operational basis and search intent were already used"
            : "the title, keywords and search intent are too similar",
      };
    }
  }

  return strongest;
}
