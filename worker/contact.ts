import { contactServices } from "../lib/contact-contract";
import { sanitizeAttribution } from "../lib/attribution";

export interface SendEmail {
  send(message: {
    to: string;
    from: string | { email: string; name?: string };
    subject: string;
    html: string;
    text: string;
    replyTo?: string;
  }): Promise<{ messageId: string }>;
}

export interface ContactBindings {
  LEADS_DB?: D1Database;
  CONTACT_EMAIL: SendEmail;
  LEAD_REVIEW_AFTER_DAYS?: string;
  // Only an isolated preview may set this. A browser cannot opt into test mode.
  LEAD_TEST_MODE?: string;
}

type Receipt = { id: string; payload_hash: string; classification: string; notification_status: string };
const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const json = (body: Record<string, unknown>, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, ...extraHeaders } });
const readText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const log = (event: string, id?: string) => console.info(JSON.stringify({ event, ...(id ? { inquiryId: id } : {}) }));
const unavailable = () => json({ ok: false, accepted: false, message: "We could not save your request. Please try again or email info@runexlogi.com." }, 503);

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

// Enforce the limit on actual streamed bytes, even without Content-Length.
async function readPayload(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 20_000) { await reader.cancel(); throw new Error("large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("invalid");
  return payload as Record<string, unknown>;
}

export function reviewAfterDays(value?: string) {
  const days = Number(value || 90);
  return Number.isInteger(days) && days >= 7 && days <= 365 ? days : 90;
}

function acceptedResponse(receipt: Receipt, measurementEligible: boolean) {
  const notification = receipt.classification === "test" ? "test" :
    receipt.notification_status === "email_accepted" ? "accepted" : "pending";
  return json({ ok: true, accepted: true, receiptId: receipt.id, notification,
    measurementEligible: measurementEligible && receipt.classification !== "test" });
}

export async function handleContactRequest(request: Request, env: ContactBindings): Promise<Response> {
  if (request.method !== "POST") return json({ ok: false, message: "Method not allowed." }, 405);
  if (Number(request.headers.get("content-length") || 0) > 20_000) return json({ ok: false, message: "Request is too large." }, 413);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ ok: false, message: "Please submit the contact form." }, 415);
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).origin !== new URL(request.url).origin) return json({ ok: false, message: "Invalid request origin." }, 403);
  } catch { return json({ ok: false, message: "Invalid request origin." }, 403); }

  let payload: Record<string, unknown>;
  try { payload = await readPayload(request); }
  catch (error) {
    return json({ ok: false, message: error instanceof Error && error.message === "large" ? "Request is too large." : "Please complete the form and try again." }, error instanceof Error && error.message === "large" ? 413 : 400);
  }
  if (readText(payload.website, 200)) {
    log("contact_blocked");
    // Keep the neutral acknowledgement; do not expose the blocking rule or save fake leads.
    return json({ ok: true, accepted: false, measurementEligible: false });
  }
  const data = {
    name: readText(payload.name, 80), company: readText(payload.company, 120),
    email: readText(payload.email, 254).toLowerCase(), phone: readText(payload.phone, 50),
    service: readText(payload.service, 80), details: readText(payload.details, 3000),
  };
  if (data.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
    !contactServices.some((service) => service === data.service) || data.details.length < 20) {
    return json({ ok: false, message: "Please complete all required fields." }, 400);
  }
  const idempotencyKey = readText(payload.submissionId, 100);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return json({ ok: false, message: "Please refresh the form and try again." }, 400);
  }
  const db = env.LEADS_DB;
  if (!db) { log("contact_storage_unavailable"); return unavailable(); }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(data)));
  const payloadHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const reviewAfter = new Date(Date.parse(now) + reviewAfterDays(env.LEAD_REVIEW_AFTER_DAYS) * 86_400_000).toISOString();
  const test = env.LEAD_TEST_MODE === "true";
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  let receipt: Receipt;
  let created = false;
  try {
    const inserted = await db.prepare(`INSERT INTO contact_inquiries
      (id, idempotency_key, payload_hash, created_at, updated_at, review_after, classification, notification_status,
       name, company, email, phone, service, details, attribution_json)
      SELECT ?1, ?2, ?3, ?4, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14
      WHERE (SELECT count(*) FROM contact_inquiries WHERE created_at >= ?15) < 60
        AND (SELECT count(*) FROM contact_inquiries WHERE email = ?10 AND created_at >= ?15) < 5
      ON CONFLICT(idempotency_key) DO NOTHING`).bind(id, idempotencyKey, payloadHash, now, reviewAfter,
      test ? "test" : "unreviewed", test ? "test" : "pending", data.name, data.company, data.email,
      data.phone, data.service, data.details, JSON.stringify(sanitizeAttribution(payload.attribution)), hourAgo).run();
    if (!inserted.success) throw new Error("storage");
    created = inserted.meta.changes === 1;
    const stored = await db.prepare("SELECT id, payload_hash, classification, notification_status FROM contact_inquiries WHERE idempotency_key = ?1").bind(idempotencyKey).first<Receipt>();
    if (!stored) {
      log("contact_rate_limited");
      return json({ ok: false, accepted: false, message: "We are receiving a high volume of requests. Please try again later or email info@runexlogi.com." }, 429, { "Retry-After": "60" });
    }
    receipt = stored;
    if (receipt.payload_hash !== payloadHash) return json({ ok: false, message: "This submission reference was already used. Please refresh the form and try again." }, 409);
  } catch { log("contact_storage_failed"); return unavailable(); }

  // A retry may claim a saved-but-never-attempted notification atomically. It
  // cannot repeat a sending/failed/accepted email or create another conversion.
  if (test || receipt.classification === "test") return acceptedResponse(receipt, false);
  if (created) log("contact_saved", receipt.id);
  if (receipt.notification_status !== "pending") return acceptedResponse(receipt, created);
  try {
    const claim = await db.prepare("UPDATE contact_inquiries SET notification_status = 'sending', notification_attempts = notification_attempts + 1, updated_at = ?1 WHERE id = ?2 AND notification_status = 'pending' AND notification_attempts = 0").bind(now, receipt.id).run();
    if (!claim.success) throw new Error("claim");
    if (claim.meta.changes !== 1) return acceptedResponse(receipt, created);
  } catch {
    log("contact_notification_pending", receipt.id);
    return acceptedResponse(receipt, created);
  }

  let notificationStatus = "email_failed";
  let providerMessageId: string | null = null;
  try {
    const lines = ["New quote request from runexlogi.com", `Reference: ${receipt.id}`, "",
      `Name: ${data.name}`, `Company: ${data.company || "Not provided"}`, `Email: ${data.email}`,
      `Phone: ${data.phone || "Not provided"}`, `Service: ${data.service}`, "", "Requirements:", data.details];
    const result = await env.CONTACT_EMAIL.send({
      to: "tonygu0826@gmail.com",
      from: { email: "info@runexlogi.com", name: "Runex Website" },
      replyTo: data.email,
      subject: `Runex quote request — ${data.service} [${receipt.id}]`,
      text: lines.join("\n"),
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#10273a"><h1>New Runex quote request</h1><p>${lines.map(escapeHtml).join("<br>")}</p></div>`,
    });
    notificationStatus = "email_accepted";
    providerMessageId = typeof result?.messageId === "string" ? result.messageId.slice(0, 254) : null;
    log("contact_email_accepted", receipt.id);
  } catch {
    // Do not log provider errors: they can include message content or contact data.
    log("contact_email_failed", receipt.id);
  }
  receipt.notification_status = notificationStatus;
  try {
    const updated = await db.prepare("UPDATE contact_inquiries SET notification_status = ?1, provider_message_id = ?2, updated_at = ?3 WHERE id = ?4").bind(notificationStatus, providerMessageId, new Date().toISOString(), receipt.id).run();
    if (!updated.success) throw new Error("storage");
  } catch {
    // The persisted 'sending' record requires reconciliation, never blind resending.
    log("contact_notification_status_unconfirmed", receipt.id);
    receipt.notification_status = "sending";
  }
  return acceptedResponse(receipt, created);
}
