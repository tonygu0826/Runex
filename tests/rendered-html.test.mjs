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

test("initializes the OpenAI Ads pixel exactly once", async () => {
  const response = await render("/");
  const html = await response.text();
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? "";

  assert.equal(response.status, 200);
  assert.equal(
    (head.match(/https:\/\/bzrcdn\.openai\.com\/sdk\/oaiq\.min\.js/g) ?? []).length,
    1,
  );
  assert.equal(
    (head.match(/9MPjBuNd4aM4F6unct8oQ8/g) ?? []).length,
    2,
  );
  assert.match(head, /oaiq\(["']init["']/);
});

test("does not emit build-machine font URLs", async () => {
  const response = await render("/");
  const html = await response.text();

  assert.doesNotMatch(html, /\/workspace\//);
  assert.doesNotMatch(html, /<link[^>]+rel=["']preload["'][^>]+as=["']font["']/i);
});

test("redirects public HTTP requests to HTTPS", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-https-redirect`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(new Request("http://runexlogi.com/contact"), {}, { waitUntil() {}, passThroughOnException() {} });

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://runexlogi.com/contact");
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
    assert.match(html, /Information that makes the plan more useful/);
    assert.match(html, /RELATED OPERATIONAL INSIGHTS/);
    assert.match(html, /href=["']\/insights\//);
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

test("gives each Insights pagination page its own canonical URL", async () => {
  const response = await render("/insights?page=2");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /rel=["']canonical["'][^>]*href=["']https:\/\/runexlogi\.com\/insights\?page=2["']/);
});


test("serves an automatically updated AI content guide", async () => {
  const response = await render("/llms.txt");
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/plain\b/i);
  assert.match(body, /# Runex Logistics Inc\./);
  assert.match(body, /## Core service pages/);
  assert.match(body, /## Current knowledge topics/);
  assert.doesNotMatch(body, /Kitting and Light Assembly to Simplify Fulfillment/);
  assert.match(body, /info@runexlogi\.com/);
});


test("connects an insight to its service and related guidance", async () => {
  const response = await render("/insights/planning-overflow-storage-without-losing-inventory-visibility");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /AI-assisted drafting and automated editorial checks/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.doesNotMatch(html, /"@type":"FAQPage"/);
  assert.match(html, /name=["']robots["'][^>]*content=["']noindex, follow["']/);
  assert.match(html, /href=["']\/solutions\/warehousing-fulfillment-canada["']/);
  assert.match(html, /USEFUL NEXT STEPS/);
});
