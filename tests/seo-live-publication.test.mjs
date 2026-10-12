import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertLiveArticle, checkLivePublication, publicationTarget, verifyLivePublication } from "../scripts/verify-seo-live.mjs";

const target = { slug: "sample-guide", title: "A Complete Sample Guide for Warehouse Operators", publishedAt: "2026-10-12" };
const url = `https://runexlogi.com/insights/${target.slug}`;
const source = `export const articles: Article[] = [\n${JSON.stringify(target, null, 2)}\n];`;
const html = (overrides = {}) => `<html><head><link href="${url}" rel="canonical"><script type="application/ld+json">${JSON.stringify([{ "@type": "Article", mainEntityOfPage: url, headline: target.title, datePublished: target.publishedAt, ...overrides }])}</script></head></html>`;
const request = async (address) => ({ status: 200, text: async () =>
  address === url ? html() : address.endsWith("/insights") ? `<a href="/insights/${target.slug}">Read article</a>` : address.endsWith("sitemap.xml") ? `<urlset><url><loc>${url}</loc></url></urlset>` : address.endsWith("contact") ? "<html><form></form></html>" : "<html>Runex</html>" });

test("requires one active publication for the exact day, not modifiedAt or superseded metadata", () => {
  assert.equal(publicationTarget(source, target.publishedAt).slug, target.slug);
  assert.throws(() => publicationTarget(source, "2026-10-11"), /No active article/);
  const duplicate = `export const articles: Article[] = [\n${JSON.stringify(target, null, 2)},\n${JSON.stringify({ ...target, slug: "second" }, null, 2)}\n];`;
  assert.throws(() => publicationTarget(duplicate, target.publishedAt), /found 2/);
  const superseded = source.replace('"publishedAt": "2026-10-12"', '"supersededBy": "replacement",\n"publishedAt": "2026-10-12"');
  assert.throws(() => publicationTarget(superseded, target.publishedAt), /No active article/);
});

test("a live page must match title, publication date and canonical with indexing enabled", () => {
  assert.doesNotThrow(() => assertLiveArticle(html(), target, url));
  assert.throws(() => assertLiveArticle(html({ datePublished: "2026-10-11" }), target, url), /title\/date/);
  assert.throws(() => assertLiveArticle(html({ headline: "Old guide" }), target, url), /title\/date/);
  assert.throws(() => assertLiveArticle(html().replace(`href="${url}"`, 'href="https://runexlogi.com/old"'), target, url), /canonical/);
  assert.throws(() => assertLiveArticle(html().replace("<head>", '<head><meta content="noindex,follow" name="robots">'), target, url), /disallows indexing/);
});

test("a 200 article response alone is not a completed publication", async () => {
  assert.deepEqual(await checkLivePublication({ target, request }), { url, publishedAt: target.publishedAt });
  for (const [path, body, error] of [["/insights", "<html>Old listing</html>", /listing/], ["/sitemap.xml", "<urlset></urlset>", /sitemap/], ["/contact", "<html>Error page</html>", /contact/]]) {
    await assert.rejects(checkLivePublication({ target, request: async (address, options) => new URL(address).pathname === path ? { status: 200, text: async () => body } : request(address, options) }), error);
  }
  await assert.rejects(checkLivePublication({ target, request: async () => ({ status: 503 }) }), /HTTP 503/);
});

test("waits through deployment propagation but fails within a bounded deadline", async () => {
  let clock = 0;
  let attempts = 0;
  const eventual = await verifyLivePublication({ source, date: target.publishedAt, maxWaitMs: 30_000, now: () => clock,
    wait: async (ms) => { clock += ms; }, logger: { warn() {} },
    request: async (address, options) => { if (address === url && attempts++ === 0) return { status: 404 }; return request(address, options); } });
  assert.equal(eventual.url, url);
  assert.equal(attempts, 2);
  clock = 0;
  await assert.rejects(verifyLivePublication({ source, date: target.publishedAt, maxWaitMs: 30_000, now: () => clock,
    wait: async (ms) => { clock += ms; }, logger: { warn() {} }, request: async () => ({ status: 503 }) }), /within 30000 ms/);
  assert.equal(clock, 30_000);
});

test("the workflow applies freshness to manual runs and verifies the final remote snapshot", async () => {
  const workflow = await readFile(new URL("../.github/workflows/daily-seo-article.yml", import.meta.url), "utf8");
  assert.doesNotMatch(workflow, /EVENT_NAME.*workflow_dispatch|should_publish=true[\s\S]*exit 0/);
  assert.match(workflow, /node scripts\/check-seo-publication\.mjs "\$TODAY"/);
  assert.match(workflow, /git show origin\/main:app\/insights\/articles\.ts > "\$RUNNER_TEMP\/published-articles\.ts"/);
  assert.match(workflow, /node scripts\/verify-seo-live\.mjs "\$PUBLICATION_DATE"/);
});
