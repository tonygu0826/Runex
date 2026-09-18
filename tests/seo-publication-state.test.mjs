import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { hasArticlePublishedOn } from "../scripts/check-seo-publication.mjs";

const wrap = (articles) => `export const articles: Article[] = [\n${articles.map((article) => JSON.stringify(article, null, 2)).join(",\n")}\n];`;
const article = { slug: "existing-guide", publishedAt: "2026-09-15" };
const checker = fileURLToPath(new URL("../scripts/check-seo-publication.mjs", import.meta.url));

test("a date in modifiedAt or example prose must not suppress a new publication", () => {
  const source = wrap([{ ...article, modifiedAt: "2026-09-18", keyAnswer: "For example, the order may arrive on 2026-09-18." }]);
  assert.equal(source.includes("2026-09-18"), true); // Reproduces the old grep false positive.
  assert.equal(hasArticlePublishedOn(source, "2026-09-18"), false);
  assert.equal(hasArticlePublishedOn(source, "2026-09-15"), true);
});

test("an active publishedAt match is sufficient, including unquoted legacy properties", () => {
  const source = `export const articles: Article[] = [
    {
      slug: 'legacy-format',
      publishedAt: '2026-09-18',
    },
  ];`;
  assert.equal(hasArticlePublishedOn(source, "2026-09-18"), true);
  assert.equal(hasArticlePublishedOn(wrap([{ ...article, publishedAt: "2026-09-18" }]), "2026-09-18"), true);
});

test("superseded articles and a date merely quoted in body text do not count", () => {
  assert.equal(hasArticlePublishedOn(wrap([{ ...article, publishedAt: "2026-09-18", supersededBy: "canonical-guide" }]), "2026-09-18"), false);
  const source = wrap([{ ...article, keyAnswer: 'An example says: "publishedAt": "2026-09-18". It is not a publication record.' }]);
  assert.equal(hasArticlePublishedOn(source, "2026-09-18"), false);
});

test("empty valid archives are unpublished, but malformed inputs fail explicitly", () => {
  assert.equal(hasArticlePublishedOn(wrap([]), "2026-09-18"), false);
  assert.throws(() => hasArticlePublishedOn("invalid file", "2026-09-18"), /Article array is missing/);
  assert.throws(() => hasArticlePublishedOn(wrap([article]).slice(0, -2), "2026-09-18"), /Article array is incomplete/);
  assert.throws(() => hasArticlePublishedOn(wrap([{ slug: "missing-date" }]), "2026-09-18"), /publication metadata is missing/);
  for (const date of [undefined, "2026-02-30", "2026-13-01", "18-09-2026"]) {
    assert.throws(() => hasArticlePublishedOn(wrap([]), date), /valid YYYY-MM-DD/);
  }
});

test("the CLI checks piped remote snapshots and reports read errors as failures", () => {
  const found = spawnSync(process.execPath, [checker, "2026-09-18", "-"], { input: wrap([{ ...article, publishedAt: "2026-09-18" }]), encoding: "utf8" });
  assert.equal(found.status, 0, found.stderr);
  assert.equal(found.stdout, "true\n");
  const missing = spawnSync(process.execPath, [checker, "2026-09-18", "-"], { input: wrap([article]), encoding: "utf8" });
  assert.equal(missing.status, 0, missing.stderr);
  assert.equal(missing.stdout, "false\n");
  const invalid = spawnSync(process.execPath, [checker, "2026-09-18", "-"], { input: "not an article file", encoding: "utf8" });
  assert.notEqual(invalid.status, 0);
  assert.equal(invalid.stdout, "");
});
