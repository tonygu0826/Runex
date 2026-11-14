import { sanitizeAttribution, safeCampaign, safePath, safeReferrer, type Attribution } from "../../lib/attribution";

const key = "runex-inquiry-source-v1";
const sessionWindow = 30 * 60 * 1000;

// First-party, tab-scoped context; sent only alongside an intentional inquiry.
// A blocked storage API must never prevent submitting the form.
export function captureAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const touch = {
    path: safePath(window.location.pathname), referrer: safeReferrer(document.referrer),
    utm_source: safeCampaign(params.get("utm_source")),
    utm_medium: safeCampaign(params.get("utm_medium")),
    utm_campaign: safeCampaign(params.get("utm_campaign")),
  };
  let attribution: Attribution = { first: touch, last: touch };
  try {
    const previous = JSON.parse(sessionStorage.getItem(key) || "null");
    const now = Date.now();
    if (previous && Number.isFinite(previous.seenAt) && now - previous.seenAt < sessionWindow && now >= previous.seenAt) {
      attribution = sanitizeAttribution(previous);
      // Keep the last useful content page, rather than replacing it with /contact.
      const hasCampaign = touch.utm_source || touch.utm_medium || touch.utm_campaign;
      if (hasCampaign) attribution.last = touch;
      else if (touch.path && touch.path !== "/contact") attribution.last = { ...attribution.last, path: touch.path };
    }
    sessionStorage.setItem(key, JSON.stringify({ ...attribution, seenAt: now }));
  } catch { /* Privacy/storage restrictions degrade to current-page context. */ }
  return attribution;
}
