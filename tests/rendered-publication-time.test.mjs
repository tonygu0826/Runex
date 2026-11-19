import assert from "node:assert/strict";
import test from "node:test";
import { articles } from "../app/insights/articles.ts";
import { featuredServiceInsights } from "../app/insights/inquiry-paths.ts";
import { publicationReleaseAt } from "../app/insights/publication-time.mjs";

test("one deployed warm Worker hides a prepared article on every surface, then releases it at 09:00 without redeploying", async (t) => {
  // Read the article records directly: SEO similarity signals omit the category.
  const records = articles.filter((article) => !article.supersededBy).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const target = records[0];
  const release = Date.parse(publicationReleaseAt(target.publishedAt));
  t.mock.timers.enable({ apis: ["Date"], now: release - 1 });
  const { default: worker } = await import("../dist/server/index.js");
  const request = async (pathname) => {
    const response = await worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.headers.get("Cache-Control"), "no-store", pathname);
    return { status: response.status, body: await response.text() };
  };
  const url = `/insights/${target.slug}`;
  // The repaired Oct 24 route keeps the old candidate URL as a safe alias.
  const aliases = target.slug === "decimal-quantity-import-separator-rules"
    ? ["/insights/importing-decimal-quantities-source-files-use-different"] : [];
  const surfaces = ["/insights", "/sitemap.xml", "/llms.txt"];
  const serviceCategories = {
    "warehousing-fulfillment-canada": ["3PL & Warehousing", "Fulfillment"],
    "fba-ecommerce-prep-canada": ["FBA & E-commerce", "Fulfillment"],
    "transportation-cross-docking-canada": ["Distribution", "Supply Chain"],
  };
  assert.ok(Object.values(serviceCategories).flat().includes(target.category), `Unmapped article category: ${target.category}`);
  async function verifyServiceLinks(visible) {
    for (const [service, categories] of Object.entries(serviceCategories)) {
      const pinned = featuredServiceInsights[service].filter(slug => visible.some(a => a.slug === slug));
      const eligible = visible.filter(a => categories.includes(a.category) && !pinned.includes(a.slug));
      const expected = [...pinned, ...eligible.map(a => a.slug)].slice(0, 3);
      const { status, body } = await request(`/solutions/${service}`);
      assert.equal(status, 200);
      const cards = body.match(/<section\b[^>]*\bid="operational-insights"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? "";
      const actual = [...cards.matchAll(/<a\b[^>]*\bhref="\/insights\/([^"]+)"/g)].map(match => match[1]);
      assert.deepEqual(actual, expected, `Published recommendation links for ${service}`);
    }
  }
  const hidden = await request(url);
  assert.equal(hidden.status, 404);
  assert.ok(!hidden.body.includes(target.title));
  for (const alias of aliases) assert.equal((await request(alias)).status, 404);
  for (const surface of surfaces) {
    const result = await request(surface);
    assert.equal(result.status, 200);
    assert.ok(!result.body.includes(url), `${surface} exposed the unreleased article`);
  }
  const status = JSON.parse((await request("/api/seo-status")).body);
  assert.ok(status.prepared.some((row) => row.date === target.publishedAt));
  await verifyServiceLinks(records.filter(a => a.publishedAt < target.publishedAt));
  t.mock.timers.setTime(release);
  const live = await request(url);
  assert.equal(live.status, 200);
  assert.ok(live.body.includes(`https://runexlogi.com${url}`));
  for (const alias of aliases) {
    const response = await worker.fetch(new Request(`http://localhost${alias}`, { headers: { accept: "text/html" } }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get("location"), "http://localhost").pathname, url);
  }
  for (const surface of surfaces) {
    const result = await request(surface);
    assert.equal(result.status, 200);
    assert.ok(result.body.includes(url), `${surface} kept the pre-release response after 09:00`);
  }
  await verifyServiceLinks(records);
});
