# SEO publishing: plan before drafting

The generator first checks the **whole** article archive, not just recent titles.
An editorial brief is consumed when its ID or two distinct evidence statements
appear in a published article, including superseded articles. Historical evidence
text in `scripts/seo-editorial-briefs.mjs` must remain stable.

## Generation flow

1. Remove consumed briefs. If none remain, fail explicitly before contacting the
   model. Do not recycle a brief or change its ID to hide historical coverage.
2. Ask for a small topic plan: one supplied reader question, proposed metadata,
   grounded answer and outline. Validate lengths, evidence, unsupported claims,
   existing URLs and topic overlap before requesting prose.
3. Write only the approved plan. Recheck the full article, including copied
   prose, unsupported wording, evidence, sources, lengths and topic overlap.
   A conflicting topic requires a new plan. Wording and length errors are
   collected across metadata, headings, paragraphs, bullets and FAQs together.
   The model receives exact field paths, original text and constraints, and
   returns only replacements for those fields. Correct content stays intact;
   every repaired draft still passes the complete gate before it can be written.
4. Write a candidate only after the full gate passes and the input file has not
   changed. The existing workflow still builds before committing/publishing it.

No duplicate thresholds have been reduced. Search-intent comparison is lexical,
not a guarantee of perfect semantic novelty. Editorial review still matters.
The new optional `searchIntent` field preserves the chosen reader question for
future checks; existing articles and URLs are unchanged.

## Bounds and recovery

- Planning, writing and field repair **share** `SEO_GENERATION_MAX_ATTEMPTS`: 6 API requests by
  default, capped at 8. A plan is never mistaken for a completed article.
- Planning allows 2,000 output tokens; full writing allows 8,000.
- Each request is capped at 120 seconds (including response-body reads) and the
  remaining overall generation time. A shorter configured request timeout is
  honoured. Generation has a 14-minute budget within the 20-minute workflow.
- Backoff remains bounded by the remaining time. Primary and backup runs start
  from different six-brief windows when enough unused briefs remain.
- `ARTICLE_TOPIC` still requires an unused, grounded brief. It considers the
  whole unused pool, but does not override duplicate or quality gates.
- Exhaustion, timeout or invalid content exits unsuccessfully without writing
  an article. The workflow schedule is unchanged. Both freshness checks parse
  an active article's exact `publishedAt` value; a matching `modifiedAt` or date
  in example text cannot suppress publication. Read or parse errors fail the
  check instead of being treated as an unpublished day.

## Maintaining the editorial pool

The 24 added briefs are **finite editorial input**, not a claim that 24 articles
are already generated or that publication can be guaranteed indefinitely. They
contain general operational recommendations, not invented customer evidence,
Runex capabilities, statistics or regulatory advice.

When fewer than 7 unused briefs remain, the generator emits a GitHub warning.
Review and replenish the pool before it is exhausted:

- Add a concrete reader question not answered by existing articles. Inspect the
  key answers and evidence, not only titles.
- Supply at least two distinct, grounded operational recommendations; keep
  service claims and external facts out unless supported by approved sources.
- Add or adapt a plan probe and run the offline tests below. A passing probe
  means the validator accepts that metadata, not that a real model has written it.
- Do not use repeated generated articles or artificial ID changes as fallback
  inventory. Review a stopped run when no supported new question remains.

## Verification without publishing

`node --test tests/seo-*.test.mjs tests/deepseek-client.test.mjs` exercises the
real archived metadata with injected model responses and isolated writes. It
requires no API key, makes no paid model calls and does not update live articles.
`npm test` additionally builds and checks rendered pages, canonical URLs,
redirects, metadata and the sitemap.

These tests do not establish live DeepSeek availability. Following a merge,
verify an authorised run through an approved plan, a fully validated article,
a commit and its matching live page. A controlled rerun uses the same freshness
checks; it must not create a second article after today's article exists.
