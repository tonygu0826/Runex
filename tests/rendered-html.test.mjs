import assert from "node:assert/strict";
import test from "node:test";

const productionCanonical =
  /<link(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']https:\/\/runexlogi\.com\/["'])[^>]*>/i;

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the production canonical URL", async () => {
  const response = await render("/");

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), productionCanonical);
});

for (const [pathname, heading, canonical] of [
  ["/solutions", "3PL solutions from receiving to delivery.", "https://runexlogi.com/solutions"],
  ["/about", "Logistics built around operational clarity.", "https://runexlogi.com/about"],
  ["/contact", "Tell us what needs to move.", "https://runexlogi.com/contact"],
]) {
  test(`renders the standalone ${pathname} page`, async () => {
    const response = await render(pathname);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(`href=["']${canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`));
  });
}

for (const [slug, heading] of [
  ["warehousing-fulfillment-canada", "Warehousing and fulfillment in Canada"],
  ["fba-ecommerce-prep-canada", "FBA and e-commerce preparation in Canada"],
  ["transportation-cross-docking-canada", "Transportation and cross-docking in Canada"],
]) {
  test(`renders the focused service page for ${slug}`, async () => {
    const pathname = `/solutions/${slug}`;
    const response = await render(pathname);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, new RegExp(`<h1[^>]*>${heading}</h1>`));
    assert.match(html, /"@type":"Service"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
  });
}

test("lists the three focused service pages in the sitemap", async () => {
  const response = await render("/sitemap.xml");
  const body = await response.text();

  assert.equal(response.status, 200);
  for (const slug of [
    "warehousing-fulfillment-canada",
    "fba-ecommerce-prep-canada",
    "transportation-cross-docking-canada",
  ]) {
    assert.match(body, new RegExp(`https://runexlogi\\.com/solutions/${slug}`));
  }
});


test("renders Insights as a paginated vertical article list", async () => {
  const response = await render("/insights");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /class=["']article-index-list["']/);
  assert.match(html, /aria-label=["']Insights pagination["']/);
  assert.match(html, /aria-current=["']page["'][^>]*>1<\/a>/);
  assert.doesNotMatch(html, /class=["']article-index-grid["']/);
});
