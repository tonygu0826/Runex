import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import ts from "typescript";
import worker from "../dist/server/index.js";

const importSource = async (path) => import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64")}`);
const { shouldMeasureInquiry } = await importSource("../lib/contact-contract.ts");
const { sanitizeAttribution, safePath, safeCampaign, safeReferrer } = await importSource("../lib/attribution.ts");

function database(fail = () => false) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../migrations/0001_contact_inquiries.sql", import.meta.url), "utf8"));
  return {
    sqlite,
    prepare(sql) {
      if (fail(sql)) throw new Error("simulated database failure");
      const statement = sqlite.prepare(sql);
      return { bind(...values) {
        return {
          async run() { const result = statement.run(...values); return { success: true, meta: { changes: result.changes } }; },
          async first() { return statement.get(...values) ?? null; },
        };
      } };
    },
  };
}
const valid = (extra = {}) => ({
  name: "Example Sender", company: "Example Company", email: "example@example.invalid",
  phone: "", service: "Cross-docking", details: "Test freight requirements for a local-only automated check.",
  website: "", submissionId: crypto.randomUUID(), ...extra,
});
const ctx = { waitUntil() {}, passThroughOnException() {} };
function request(payload, options = {}) {
  return new Request("https://runexlogi.com/api/contact", {
    method: "POST", headers: { "Content-Type": "application/json", origin: "https://runexlogi.com", ...options.headers },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  });
}
function setup(options = {}) {
  const db = database(options.fail);
  const sent = [];
  const env = { LEADS_DB: db, CONTACT_EMAIL: { async send(message) {
    // Durable persistence must precede any provider call.
    assert.ok(db.sqlite.prepare("SELECT count(*) AS n FROM contact_inquiries").get().n >= 1);
    sent.push(message);
    if (options.send) return options.send(message);
    return { messageId: "local-provider-acceptance" };
  } }, ...options.env };
  return { db, sent, env, submit: (payload, opts) => worker.fetch(request(payload, opts), env, ctx) };
}
const row = (fixture) => fixture.db.sqlite.prepare("SELECT * FROM contact_inquiries").get();

test("a honeypot acknowledgement never saves, sends, or counts an inquiry", async () => {
  const f = setup();
  const response = await f.submit(valid({ website: "bot.example" }));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(result, { ok: true, accepted: false, measurementEligible: false });
  assert.equal(row(f), undefined);
  assert.equal(f.sent.length, 0);
  assert.equal(shouldMeasureInquiry(result), false);
  assert.doesNotMatch(JSON.stringify(result), /honeypot|spam|blocked/);
});

test("saves once before email, reports provider acceptance rather than delivery/qualification", async () => {
  const f = setup();
  const response = await f.submit(valid());
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(result.accepted, true);
  assert.equal(result.notification, "accepted");
  assert.equal(shouldMeasureInquiry(result), true);
  assert.equal(row(f).id, result.receiptId);
  assert.equal(row(f).classification, "unreviewed");
  assert.equal(row(f).notification_status, "email_accepted");
  assert.equal(row(f).notification_attempts, 1);
  assert.equal(row(f).provider_message_id, "local-provider-acceptance");
  assert.equal(f.sent[0].to, "tonygu0826@gmail.com");
  assert.equal(f.sent[0].from.email, "info@runexlogi.com");
  assert.match(f.sent[0].text, new RegExp(result.receiptId));
  assert.equal("delivered" in result, false);
});

test("repeated and concurrent submissions are idempotent", async () => {
  const f = setup();
  const payload = valid();
  const results = await Promise.all([f.submit(payload), f.submit(payload), f.submit(payload)]);
  const receipts = await Promise.all(results.map((response) => response.json()));
  assert.equal(new Set(receipts.map((r) => r.receiptId)).size, 1);
  assert.equal(receipts.filter(shouldMeasureInquiry).length, 1);
  assert.equal(f.sent.length, 1);
  assert.equal(row(f).notification_attempts, 1);
});

test("reusing an idempotency key with changed details is rejected", async () => {
  const f = setup();
  const payload = valid();
  await f.submit(payload);
  const response = await f.submit({ ...payload, details: "A different set of freight handling requirements." });
  assert.equal(response.status, 409);
  assert.equal(f.sent.length, 1);
  assert.equal(row(f).details, payload.details);
});

test("failed email leaves a recoverable inquiry and retry does not duplicate notification", async () => {
  const f = setup({ send: () => { throw new Error("example@example.invalid private body"); } });
  const payload = valid();
  const result = await (await f.submit(payload)).json();
  assert.equal(result.accepted, true);
  assert.equal(result.notification, "pending");
  assert.equal(row(f).notification_status, "email_failed");
  assert.equal(row(f).details, payload.details);
  const retried = await (await f.submit(payload)).json();
  assert.equal(retried.receiptId, result.receiptId);
  assert.equal(shouldMeasureInquiry(retried), false);
  assert.equal(f.sent.length, 1);
});

test("storage unavailable fails visibly and never emails an unrecorded inquiry", async () => {
  for (const options of [{ env: { LEADS_DB: undefined } }, { fail: (sql) => sql.startsWith("INSERT") }]) {
    const f = setup(options);
    const response = await f.submit(valid());
    assert.equal(response.status, 503);
    assert.equal((await response.json()).accepted, false);
    assert.equal(f.sent.length, 0);
  }
});

test("email claim failure keeps durable pending record without sending", async () => {
  const f = setup({ fail: (sql) => sql.includes("notification_attempts =") });
  const result = await (await f.submit(valid())).json();
  assert.equal(result.accepted, true);
  assert.equal(result.notification, "pending");
  assert.equal(row(f).notification_status, "pending");
  assert.equal(f.sent.length, 0);
});

test("post-send database failure keeps ambiguous sending state for reconciliation", async () => {
  const f = setup({ fail: (sql) => sql.startsWith("UPDATE") && sql.includes("provider_message_id") });
  const payload = valid();
  const result = await (await f.submit(payload)).json();
  assert.equal(result.accepted, true);
  assert.equal(result.notification, "pending");
  assert.equal(row(f).notification_status, "sending");
  await f.submit(payload);
  assert.equal(f.sent.length, 1);
});

test("only server-side isolated test mode marks tests and suppresses email/conversions", async () => {
  const f = setup({ env: { LEAD_TEST_MODE: "true" } });
  const result = await (await f.submit(valid())).json();
  assert.equal(result.notification, "test");
  assert.equal(row(f).classification, "test");
  assert.equal(f.sent.length, 0);
  assert.equal(shouldMeasureInquiry(result), false);
  const normal = setup();
  const browserFlag = await (await normal.submit(valid({ isTest: true, classification: "test" }))).json();
  assert.equal(browserFlag.notification, "accepted");
  assert.equal(row(normal).classification, "unreviewed");
});

test("validation rejects invalid origins, malformed/non-object JSON, fields and IDs", async () => {
  const f = setup();
  for (const [payload, headers, status] of [
    [valid(), { origin: "bad url" }, 403], [valid(), { origin: "https://evil.example" }, 403],
    [valid(), { origin: "https://runexlogi.com:1234" }, 403],
    ["null", {}, 400], ["[]", {}, 400], ["broken", {}, 400],
    [valid({ email: "bad email" }), {}, 400], [valid({ service: "invented" }), {}, 400],
    [valid({ details: "short" }), {}, 400], [valid({ submissionId: "bad" }), {}, 400],
    [valid(), { "Content-Type": "text/plain" }, 415],
  ]) assert.equal((await f.submit(payload, { headers })).status, status);
  assert.equal(f.sent.length, 0);
});

test("actual body bytes are bounded even without a content-length header", async () => {
  const f = setup();
  assert.equal((await f.submit(valid({ details: "x".repeat(20_001) }))).status, 413);
  assert.equal((await f.submit(valid(), { headers: { "Content-Length": "30000" } })).status, 413);
  assert.equal(f.sent.length, 0);
});

test("email markup is escaped and private details stay out of the response", async () => {
  const f = setup();
  const response = await f.submit(valid({ name: "<script>alert(1)</script>", details: "<img src=x onerror=alert(1)> Details for freight." }));
  const text = await response.text();
  assert.doesNotMatch(f.sent[0].html, /<script>|<img/);
  assert.match(f.sent[0].html, /&lt;script&gt;/);
  assert.doesNotMatch(text, /example@|freight|script|Company/);
});

test("attribution is bounded, strips URL secrets and excludes unwanted personal identifiers", async () => {
  const f = setup();
  await f.submit(valid({ ip: "192.0.2.1", attribution: {
    first: { path: "/solutions?email=private@example.com#token", referrer: "https://www.google.ca/search?q=private", utm_source: "google", utm_medium: "cpc", utm_campaign: "autumn_freight", gclid: "secret" },
    last: { path: "https://evil.example/private", referrer: "https://secret.customer.example/a?token=private", utm_source: "private@example.com", utm_campaign: "phone_123456789" },
  } }));
  const serialized = row(f).attribution_json;
  const attribution = JSON.parse(serialized);
  assert.equal(attribution.first.path, "/solutions");
  assert.equal(attribution.first.referrer, "google");
  assert.equal(attribution.last.path, "");
  assert.equal(attribution.last.referrer, "other");
  assert.doesNotMatch(serialized, /private|token|secret|192\.0|gclid|123456/);
  assert.equal(safePath("//evil.example"), "");
  assert.equal(safePath("/insights/normal-route?secret=1"), "/insights/normal-route");
  assert.equal(safeCampaign("a".repeat(65)), "");
  assert.equal(safeReferrer("google"), "google");
  assert.deepEqual(sanitizeAttribution(attribution), attribution);
});

test("review date is configurable; no automatic deletion or public listing endpoint exists", async () => {
  const f = setup({ env: { LEAD_REVIEW_AFTER_DAYS: "30" } });
  await f.submit(valid());
  const saved = row(f);
  assert.equal((Date.parse(saved.review_after) - Date.parse(saved.created_at)) / 86_400_000, 30);
  const response = await worker.fetch(new Request("https://runexlogi.com/api/contact"), f.env, ctx);
  assert.equal(response.status, 405);
});

test("measurement gate rejects legacy ok-only, blocked, test and duplicate results", () => {
  for (const result of [{ ok: true }, { ok: true, accepted: false }, { ok: true, accepted: true, receiptId: "receipt", measurementEligible: false }]) assert.equal(shouldMeasureInquiry(result), false);
  const ads = readFileSync(new URL("../app/openai-ads.ts", import.meta.url), "utf8");
  assert.match(ads, /opt_out:\s*true/);
  assert.doesNotMatch(ads, /email|phone|hash|user_agent|external_id/);
});

test("atomic new-inquiry caps hold under concurrency without saving or sending rejected requests", async () => {
  const f = setup();
  const payloads = Array.from({ length: 65 }, (_, i) => valid({ email: `load${i}@example.invalid` }));
  const responses = await Promise.all(payloads.map((payload) => f.submit(payload)));
  assert.equal(responses.filter((response) => response.status === 200).length, 60);
  assert.equal(responses.filter((response) => response.status === 429).length, 5);
  assert.equal(f.db.sqlite.prepare("SELECT count(*) AS n FROM contact_inquiries").get().n, 60);
  assert.equal(f.sent.length, 60);
  const retry = await f.submit(payloads[0]);
  assert.equal(retry.status, 200);
  assert.equal(shouldMeasureInquiry(await retry.json()), false);
  assert.equal(f.sent.length, 60);
});

test("per-email hourly limit rejects only new inquiries, with neutral errors and bounded retry hint", async () => {
  const f = setup();
  const payloads = Array.from({ length: 8 }, () => valid());
  const responses = await Promise.all(payloads.map((payload) => f.submit(payload)));
  assert.equal(responses.filter((response) => response.status === 200).length, 5);
  assert.equal(f.sent.length, 5);
  const rejected = responses.find((response) => response.status === 429);
  assert.equal(rejected.headers.get("retry-after"), "60");
  const text = await rejected.text();
  assert.doesNotMatch(text, /example@example|per.email|already.*email/i);
  assert.equal((await f.submit(payloads[0])).status, 200);
  assert.equal(f.sent.length, 5);
});

test("a read failure after saving can atomically send once on a same-key retry", async () => {
  let reads = 0;
  const f = setup({ fail: (sql) => sql.startsWith("SELECT") && ++reads === 1 });
  const payload = valid();
  assert.equal((await f.submit(payload)).status, 503);
  assert.equal(row(f).notification_status, "pending");
  const result = await (await f.submit(payload)).json();
  assert.equal(result.accepted, true);
  assert.equal(result.notification, "accepted");
  assert.equal(shouldMeasureInquiry(result), false);
  assert.equal(f.sent.length, 1);
  await f.submit(payload);
  assert.equal(f.sent.length, 1);
});

test("D1 success:false is treated as failure rather than an accepted new lead", async () => {
  let sendCount = 0;
  const env = {
    LEADS_DB: { prepare() { return { bind() { return { async run() { return { success: false, meta: { changes: 0 } }; } }; } }; } },
    CONTACT_EMAIL: { async send() { sendCount++; } },
  };
  const response = await worker.fetch(request(valid()), env, ctx);
  assert.equal(response.status, 503);
  assert.equal(sendCount, 0);
});
