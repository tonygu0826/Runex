import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

function code(path) { return ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText; }
function harness() {
  const exports = {};
  vm.runInNewContext(code("../lib/attribution.ts"), { exports, URL });
  const memory = new Map();
  let now = 1_000_000;
  const context = {
    exports: {}, require: () => exports, URLSearchParams,
    Date: { now: () => now }, window: { location: { pathname: "/insights/example", search: "?utm_source=google&utm_medium=organic&utm_campaign=first" } },
    document: { referrer: "https://www.google.ca/search?q=private" },
    sessionStorage: { getItem: (key) => memory.get(key), setItem: (key, value) => memory.set(key, value) },
  };
  vm.runInNewContext(code("../app/contact/attribution.ts"), context);
  return { context, memory, capture: context.exports.captureAttribution, advance: (ms) => { now += ms; } };
}

test("keeps first touch and last meaningful content, including current campaign context", () => {
  const h = harness();
  h.capture();
  h.context.window.location = { pathname: "/solutions/transportation-cross-docking-canada", search: "" };
  h.capture();
  h.context.window.location = { pathname: "/contact", search: "?service=crossdock&token=secret" };
  const result = h.capture();
  assert.equal(result.first.path, "/insights/example");
  assert.equal(result.last.path, "/solutions/transportation-cross-docking-canada");
  assert.equal(result.last.utm_source, "google");
  assert.doesNotMatch(JSON.stringify(result), /token|secret|private/);
});

test("a new campaign arriving on contact becomes the last source, without erasing first touch", () => {
  const h = harness();
  h.capture();
  h.context.window.location = { pathname: "/contact", search: "?utm_source=bing&utm_medium=cpc&utm_campaign=second" };
  const result = h.capture();
  assert.equal(result.first.utm_source, "google");
  assert.equal(result.last.path, "/contact");
  assert.equal(result.last.utm_source, "bing");
  assert.equal(result.last.utm_campaign, "second");
});

test("context resets on next visit after inactivity, corrupt storage or clock rollback", () => {
  const h = harness();
  h.capture();
  h.advance(31 * 60 * 1000);
  h.context.window.location = { pathname: "/contact", search: "" };
  assert.equal(h.capture().first.path, "/contact");
  h.memory.set("runex-inquiry-source-v1", "invalid-json");
  assert.equal(h.capture().first.path, "/contact");
  h.advance(-1000);
  h.context.window.location.pathname = "/about";
  assert.equal(h.capture().first.path, "/about");
});

test("storage-denied browsers still return safe current-page attribution", () => {
  const h = harness();
  h.context.sessionStorage.getItem = () => { throw new Error("storage denied"); };
  assert.equal(h.capture().first.referrer, "google");
  assert.equal(h.capture().first.path, "/insights/example");
});
