export const PUBLICATION_TIME_ZONE = "America/Toronto";
export const PUBLICATION_HOUR = 9;

const localClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: PUBLICATION_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

export function validPublicationDate(date) {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
}

export function addPublicationDays(date, days) {
  if (!validPublicationDate(date) || !Number.isInteger(days)) throw new Error("Expected a valid publication date and whole days.");
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function parts(now) {
  const value = new Date(now);
  if (!Number.isFinite(value.getTime())) throw new Error("Invalid publication clock.");
  return Object.fromEntries(localClock.formatToParts(value).filter((item) => item.type !== "literal").map((item) => [item.type, item.value]));
}

export function publicationDate(now = new Date()) {
  const p = parts(now);
  return `${p.year}-${p.month}-${p.day}`;
}

export function releasedThroughDate(now = new Date()) {
  const p = parts(now);
  const date = `${p.year}-${p.month}-${p.day}`;
  return Number(p.hour) >= PUBLICATION_HOUR ? date : addPublicationDays(date, -1);
}

// 09:00 is outside Toronto's ambiguous/missing DST transition hours. Derive
// the offset for the requested date, never from the build machine's timezone.
export function publicationReleaseAt(date) {
  if (!validPublicationDate(date)) throw new Error("Expected a valid YYYY-MM-DD publication date.");
  const nominal = Date.parse(`${date}T09:00:00Z`);
  const p = parts(nominal);
  const localAsUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return new Date(nominal + (nominal - localAsUtc)).toISOString();
}

export function publicationStatus(articles, now = new Date()) {
  const today = publicationDate(now);
  const cutoff = releasedThroughDate(now);
  const active = articles.filter((article) => !article.supersededBy && article.qualityGatePassed && validPublicationDate(article.publishedAt));
  return {
    timeZone: PUBLICATION_TIME_ZONE,
    releaseHour: PUBLICATION_HOUR,
    asOf: new Date(now).toISOString(),
    latestPublishedAt: active.map((article) => article.publishedAt).filter((date) => date <= cutoff).sort().at(-1) ?? null,
    prepared: active.filter((article) => article.publishedAt >= today).map((article) => ({
      date: article.publishedAt, releaseAt: publicationReleaseAt(article.publishedAt),
    })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}
