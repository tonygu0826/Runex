import assert from "node:assert/strict";
import test from "node:test";
import { publicationQueue, preparePublicationQueue } from "../scripts/seo-publication-queue.mjs";

const wrap = (rows) => `export const articles: Article[] = [\n${rows.map((row) => JSON.stringify(row, null, 2)).join(",\n")}\n];`;
const row = (date) => ({ slug: `guide-${date}`, publishedAt: date });
const now = () => Date.parse("2026-10-19T23:00:00Z");

function harness(rows, failDate) {
  let archive = [...rows];
  const dates = [];
  return {
    dates, source: () => wrap(archive),
    run: (env = {}) => preparePublicationQueue({ now, env, logger: { warn() {} }, readSource: async () => wrap(archive),
      generate: async ({ env }) => {
        dates.push(env.PUBLICATION_DATE);
        if (env.PUBLICATION_DATE === failDate) throw new Error("provider unavailable");
        archive = [row(env.PUBLICATION_DATE), ...archive];
      },
    }),
  };
}

test("an already-published day still prepares tomorrow and the following day exactly once", async () => {
  const h = harness([row("2026-10-19")]);
  const first = await h.run();
  assert.deepEqual(first.prepared, ["2026-10-20", "2026-10-21"]);
  assert.deepEqual((await h.run()).prepared, []);
  assert.deepEqual(h.dates, ["2026-10-20", "2026-10-21"]);
  assert.equal(publicationQueue(h.source(), { now: now() }).missing.length, 0);
});

test("a failed second draft preserves the approved first day for build and commit", async () => {
  const h = harness([row("2026-10-19")], "2026-10-21");
  const result = await h.run();
  assert.deepEqual(result.prepared, ["2026-10-20"]);
  assert.match(result.failure, /provider unavailable/);
  assert.deepEqual(publicationQueue(h.source(), { now: now() }).missing, ["2026-10-21"]);
});

test("missing current publication takes priority and a run never generates more than two articles", async () => {
  const h = harness([row("2026-10-18")]);
  await h.run();
  assert.deepEqual(h.dates, ["2026-10-19", "2026-10-20"]);
  assert.deepEqual(publicationQueue(h.source(), { now: now() }).missing, ["2026-10-21"]);
});

test("early runs verify yesterday, date snapshots survive midnight, and bad archives fail closed", () => {
  assert.equal(publicationQueue(wrap([]), { now: "2026-10-20T12:59:59Z" }).liveDate, "2026-10-19");
  assert.deepEqual(publicationQueue(wrap([]), { now: "2026-10-20T04:01:00Z", runDate: "2026-10-19" }).upcoming, ["2026-10-20", "2026-10-21"]);
  assert.throws(() => publicationQueue(wrap([row("2026-10-19"), { ...row("2026-10-19"), slug: "second" }]), { now: now() }), /duplicate/);
  assert.throws(() => publicationQueue("invalid", { now: now() }), /missing/);
});

test("a generator that returns without a dated article does not manufacture queue success", async () => {
  const result = await preparePublicationQueue({ now, env: {}, readSource: async () => wrap([row("2026-10-19")]), generate: async () => {}, logger: { warn() {} } });
  assert.deepEqual(result.prepared, []);
  assert.match(result.failure, /produced no article/);
});
