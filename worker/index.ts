/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface SendEmail {
  send(message: {
    to: string;
    from: string | { email: string; name?: string };
    subject: string;
    html: string;
    text: string;
    replyTo?: string;
  }): Promise<{ messageId: string }>;
}

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  CONTACT_EMAIL: SendEmail;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const services = new Set([
  "Warehousing and storage",
  "E-commerce fulfillment",
  "FBA preparation",
  "Cross-docking",
  "Transportation",
  "Other logistics support",
]);

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function readText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

async function handleContactRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return json({ ok: false, message: "Method not allowed." }, 405);
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 20_000) {
    return json({ ok: false, message: "Request is too large." }, 413);
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).hostname !== requestUrl.hostname) {
    return json({ ok: false, message: "Invalid request origin." }, 403);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json() as Record<string, unknown>;
  } catch {
    return json({ ok: false, message: "Please complete the form and try again." }, 400);
  }

  if (readText(payload.website, 200)) {
    return json({ ok: true });
  }

  const name = readText(payload.name, 80);
  const company = readText(payload.company, 120);
  const email = readText(payload.email, 254).toLowerCase();
  const phone = readText(payload.phone, 50);
  const service = readText(payload.service, 80);
  const details = readText(payload.details, 3000);

  if (
    name.length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !services.has(service) ||
    details.length < 20
  ) {
    return json({ ok: false, message: "Please complete all required fields." }, 400);
  }

  const safe = {
    name: escapeHtml(name),
    company: escapeHtml(company || "Not provided"),
    email: escapeHtml(email),
    phone: escapeHtml(phone || "Not provided"),
    service: escapeHtml(service),
    details: escapeHtml(details).replace(/\n/g, "<br>"),
  };

  try {
    await env.CONTACT_EMAIL.send({
      to: "tonygu0826@gmail.com",
      from: { email: "info@runexlogi.com", name: "Runex Website" },
      replyTo: email,
      subject: `Runex quote request — ${service}`,
      text: [
        "New quote request from runexlogi.com",
        "",
        `Name: ${name}`,
        `Company: ${company || "Not provided"}`,
        `Email: ${email}`,
        `Phone: ${phone || "Not provided"}`,
        `Service: ${service}`,
        "",
        "Requirements:",
        details,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;color:#10273a;line-height:1.6;max-width:680px">
          <h1 style="color:#001b35;font-size:24px">New Runex quote request</h1>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;border-bottom:1px solid #dde4ea"><b>Name</b></td><td style="padding:8px;border-bottom:1px solid #dde4ea">${safe.name}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #dde4ea"><b>Company</b></td><td style="padding:8px;border-bottom:1px solid #dde4ea">${safe.company}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #dde4ea"><b>Email</b></td><td style="padding:8px;border-bottom:1px solid #dde4ea">${safe.email}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #dde4ea"><b>Phone</b></td><td style="padding:8px;border-bottom:1px solid #dde4ea">${safe.phone}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #dde4ea"><b>Service</b></td><td style="padding:8px;border-bottom:1px solid #dde4ea">${safe.service}</td></tr>
          </table>
          <h2 style="color:#001b35;font-size:18px;margin-top:24px">Requirements</h2>
          <p style="padding:16px;background:#f1f4f6;border-left:4px solid #ff5a0a">${safe.details}</p>
          <p style="font-size:13px;color:#667584">Reply to this email to contact ${safe.name} at ${safe.email}.</p>
        </div>
      `,
    });

    return json({ ok: true });
  } catch (error) {
    console.error("Contact email failed", error);
    return json({
      ok: false,
      message: "We could not send your request. Please email info@runexlogi.com.",
    }, 500);
  }
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleContactRequest(request, env);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
