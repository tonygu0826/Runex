export type Touch = {
  path: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
};
export type Attribution = { first: Touch; last: Touch };

// Only public route paths and bounded campaign labels. Never store full URLs,
// fragments, click IDs, search terms, email addresses or arbitrary query fields.
export function safePath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "";
  const path = value.split(/[?#]/, 1)[0];
  return /^\/(?:|about|contact|solutions(?:\/[a-z0-9-]{1,100})?|insights(?:\/[a-z0-9-]{1,120})?)$/.test(path) ? path : "";
}

export function safeCampaign(value: unknown) {
  if (typeof value !== "string" || !/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(value)) return "";
  // Numeric identifiers are not needed for source/campaign reporting.
  return /\d{6}/.test(value) ? "" : value;
}

export function safeReferrer(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  try {
    const host = new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase();
    if (/^(www\.)?runexlogi\.com$/.test(host)) return "runexlogi.com";
    if (host === "google") return "google";
    if (/^(www\.)?google\.(com|ca|co\.uk)$/.test(host)) return "google";
    for (const provider of ["bing", "duckduckgo", "yahoo", "chatgpt", "linkedin", "facebook"]) {
      if (host === provider || host === `${provider}.com` || host.endsWith(`.${provider}.com`)) return provider;
    }
    return "other";
  } catch { return ""; }
}

function sanitizeTouch(value: unknown): Touch {
  const touch = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    path: safePath(touch.path), referrer: safeReferrer(touch.referrer),
    utm_source: safeCampaign(touch.utm_source), utm_medium: safeCampaign(touch.utm_medium),
    utm_campaign: safeCampaign(touch.utm_campaign),
  };
}

export function sanitizeAttribution(value: unknown): Attribution {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return { first: sanitizeTouch(source.first), last: sanitizeTouch(source.last) };
}
