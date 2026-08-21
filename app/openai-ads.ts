declare global {
  interface Window {
    oaiq?: (...args: unknown[]) => void;
  }
}

export function trackOpenAIAdsLeadCreated() {
  try {
    window.oaiq?.(
      "measure",
      "lead_created",
      { type: "customer_action" },
      { opt_out: true },
    );
  } catch {
    // Advertising measurement must never interrupt a successful quote request.
  }
}
