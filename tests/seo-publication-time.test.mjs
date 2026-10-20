import assert from "node:assert/strict";
import test from "node:test";
import { publicationDate, releasedThroughDate, publicationReleaseAt, publicationStatus, addPublicationDays } from "../app/insights/publication-time.mjs";

test("Toronto 09:00 release follows DST, not the machine timezone or deployment time", () => {
  for (const [date, instant] of [["2026-10-20", "2026-10-20T13:00:00.000Z"], ["2026-11-01", "2026-11-01T14:00:00.000Z"], ["2027-03-14", "2027-03-14T13:00:00.000Z"]]) {
    assert.equal(publicationReleaseAt(date), instant);
    assert.equal(releasedThroughDate(Date.parse(instant) - 1), addPublicationDays(date, -1));
    assert.equal(releasedThroughDate(Date.parse(instant)), date);
  }
  assert.equal(publicationDate("2026-10-20T00:30:00Z"), "2026-10-19");
  assert.equal(addPublicationDays("2028-02-28", 2), "2028-03-01");
  for (const invalid of ["2026-02-30", "2026-13-01", "20-10-2026", undefined]) assert.throws(() => publicationReleaseAt(invalid));
});

test("deployment status reports a prepared batch without revealing unreleased content", () => {
  const articles = [
    { publishedAt: "2026-10-20", qualityGatePassed: true, title: "Hidden title", slug: "hidden-url" },
    { publishedAt: "2026-10-19", qualityGatePassed: true },
    { publishedAt: "2026-10-21", qualityGatePassed: false },
    { publishedAt: "2026-10-22", qualityGatePassed: true, supersededBy: "other" },
  ];
  const before = publicationStatus(articles, "2026-10-20T12:59:59Z");
  assert.equal(before.latestPublishedAt, "2026-10-19");
  assert.deepEqual(before.prepared, [{ date: "2026-10-20", releaseAt: "2026-10-20T13:00:00.000Z" }]);
  assert.doesNotMatch(JSON.stringify(before), /Hidden title|hidden-url/);
  assert.equal(publicationStatus(articles, "2026-10-20T13:00:00Z").latestPublishedAt, "2026-10-20");
});
