import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { extractExistingArticleSignals, extractPublicationRecords } from "../scripts/seo-quality.mjs";
import { publicationReleaseAt } from "../app/insights/publication-time.mjs";

test("one deployed warm Worker hides a prepared article on every surface, then releases it at 09:00 without redeploying", async (t) => {
  const source = await readFile(new URL("../app/insights/articles.ts", import.meta.url), "utf8");
  const record = extractPublicationRecords(source).filter((row) => !row.supersededBy).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
  const target = extractExistingArticleSignals(source).find((row) => row.slug === record.slug);
  const release = Date.parse(publicationReleaseAt(record.publishedAt));
  t.mock.timers.enable({ apis: ["Date"], now: release - 1 });
  const { default: worker } = await import("../dist/server/index.js");
  const request = async (pathname) => {
    const response = await worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
    assert.equal(response.headers.get("Cache-Control"), "no-store", pathname);
    return { status: response.status, body: await response.text() };
  };
  const url = `/insights/${record.slug}`;
  const service = target.category === "Distribution" || target.category === "Supply Chain" ? "/solutions/transportation-cross-docking-canada" : "/solutions/warehousing-fulfillment-canada";
  const surfaces = ["/insights", "/sitemap.xml", "/llms.txt", service];
  const hidden = await request(url);
  assert.equal(hidden.status, 404);
  assert.ok(!hidden.body.includes(target.title));
  for (const surface of surfaces) {
    const result = await request(surface);
    assert.equal(result.status, 200);
    assert.ok(!result.body.includes(url), `${surface} exposed the unreleased article`);
  }
  const status = JSON.parse((await request("/api/seo-status")).body);
  assert.ok(status.prepared.some((row) => row.date === record.publishedAt));
  t.mock.timers.setTime(release);
  assert.equal((await request(url)).status, 200);
  for (const surface of surfaces) {
    const result = await request(surface);
    assert.equal(result.status, 200);
    assert.ok(result.body.includes(url), `${surface} kept the pre-release response after 09:00`);
  }
});
