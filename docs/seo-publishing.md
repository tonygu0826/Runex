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
  honoured. Generation has a 14-minute budget within the 30-minute workflow.
  The additional time is reserved for build and the bounded live deployment
  check, not extra model requests.
- Backoff remains bounded by the remaining time. Primary and backup runs start
  from different six-brief windows when enough unused briefs remain.
- `ARTICLE_TOPIC` still requires an unused, grounded brief. It considers the
  whole unused pool, but does not override duplicate or quality gates.
- Exhaustion, timeout or invalid content exits unsuccessfully without writing
  an article. The workflow schedule is unchanged. Merging an editorial or
  publishing fix into main also attempts recovery for the current day, subject
  to the same freshness checks. Both freshness checks, including manual runs, parse
  an active article's exact `publishedAt` value; a matching `modifiedAt` or date
  in example text cannot suppress publication. Read or parse errors fail the
  check instead of being treated as an unpublished day.

## Maintaining the editorial pool

The original 40 briefs were all consumed by October 11, 2026. The replenishment
adds 62 reviewed reader questions in `scripts/seo-editorial-expansion.mjs`, for
102 briefs in total. They cover distinct receiving, storage, integration,
transport, reporting and commercial-workflow decisions. These are general
operating recommendations, not customer evidence, Runex capabilities,
statistics or regulatory advice. No historical brief text has changed.

The pool is finite editorial input. It must not be recycled when exhausted.
At one article per day, 62 unused briefs provide at most 62 further publishing
days; model topic rejections may reduce usable capacity. Do not describe this
as an indefinite publication guarantee.

`node scripts/seo-editorial-health.mjs` validates the pool and reads the whole
archive. A `--require-capacity` check stops an exhausted run before any model
request. Daily runs report remaining capacity in their job summary and manage
one GitHub issue when capacity reaches 30, 14, 7 and 0 unused briefs. The issue
is created once, updated only on escalation and closed after replenishment
above 30. Routine publications do not create issues or repeated comments.
The alert recommends restoring at least a 60-day buffer. The workflow needs
`issues: write`; a notification API failure is visible in its step but does
not undo or prevent valid article publication.

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

## Confirming the final result

The workflow shares one Toronto publication date across planning, commitment
and verification, including a run that crosses midnight. Manual dispatch
uses the same initial and final freshness checks as scheduled runs; supplying
a topic does not permit a second article on the same day.

After committing (or skipping because an article exists), the workflow checks
the final remote main snapshot. `verify-seo-live.mjs` requires exactly one
active article for that date, and verifies its live HTTP response, canonical,
Article structured-data title/date and indexing setting. The Insights listing
must link to it and the sitemap must contain its URL; the homepage and contact
form must render. A successful GitHub commit alone is not a successful final
publication. The read-only check retries deployment propagation for at most
five minutes, with individual requests capped at ten seconds, and fails
explicitly if the live result is still inconsistent. It does not submit forms,
rerun a deployment, modify redirects or need Cloudflare credentials.

`SEO publishing regression checks` tests publishing changes on pull requests
and main without a key or model calls. New plan probes are checked against the
full archive at the exhaustion incident and against every other new probe.
These validate candidate metadata, not a guarantee that generated prose will
pass or that lexical comparison detects every semantic duplicate.
