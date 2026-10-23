import { editorialFoundation } from "./seo-editorial-foundation.mjs";
import { slugifyBriefId } from "./seo-quality.mjs";
import { validateTopicPlan } from "./seo-topic-planner.mjs";

export function validateFoundationRefs(refs, foundation = editorialFoundation) {
  if (!Array.isArray(refs) || refs.length < 2 || refs.length > 6 || new Set(refs).size !== refs.length ||
      refs.some((id) => !foundation.some((item) => item.id === id))) throw new Error("A new brief must cite 2-6 distinct approved foundation IDs.");
}

export function validateAutoStore(store) {
  if (!store || store.version !== 1 || !Array.isArray(store.briefs) || typeof store.refillPending !== "boolean" ||
      !Number.isInteger(store.consecutiveFailures) || store.consecutiveFailures < 0) throw new Error("Invalid automatic editorial store.");
  const ids = new Set();
  for (const brief of store.briefs) {
    if (!/^auto-[a-z0-9-]+$/.test(brief.id || "") || brief.id !== `auto-${slugifyBriefId(brief.readerQuestion, 56)}` ||
        ids.has(brief.id) || brief.review?.approved !== true || !brief.review.model ||
        Number.isNaN(Date.parse(brief.review.at)) || !brief.reviewedPlan ||
        typeof brief.review.rationale !== "string" || brief.review.rationale.length < 20) throw new Error(`Unreviewed or duplicate automatic brief: ${brief.id}`);
    ids.add(brief.id);
    validateTopicPlan(brief.reviewedPlan, [brief], []);
    validateFoundationRefs(brief.foundationRefs);
  }
  return store;
}
