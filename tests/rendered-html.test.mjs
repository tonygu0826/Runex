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
  ["/solutions", "One operation from receiving to delivery.", "https://runexlogi.com/solutions"],
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
