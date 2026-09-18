import { readFile } from "node:fs/promises";
import { extractExistingArticleSignals } from "../../scripts/seo-quality.mjs";

// Freeze the pre-fix 51-article corpus without duplicating its text in fixtures.
// Daily publishing prepends records. Excluding those later records prevents a
// successful publication of a test's new topic from breaking the regression.
const source = await readFile(new URL("../../app/insights/articles.ts", import.meta.url), "utf8");
const marker = "export const articles: Article[] = [";
const markerIndex = source.indexOf(marker);
const anchor = source.indexOf('"slug": "setting-up-decision-owners-during-warehouse-onboarding"');
const historicalStart = source.lastIndexOf("\n  {", anchor);
if (markerIndex < 0 || anchor < 0 || historicalStart <= markerIndex) {
  throw new Error("The pre-fix archive anchor changed; review and update the SEO regression fixture deliberately.");
}
export const historicalSource = source.slice(0, markerIndex + marker.length) + source.slice(historicalStart);
export const historicalArchive = extractExistingArticleSignals(historicalSource);
