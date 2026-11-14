// Focused paths for existing operational guides. No changes to article evidence,
// publication quality gates, canonical URLs or the automatic editorial pool.
export const inquiryPaths: Record<string, { title: string; text: string; serviceSlug: string; query: string }> = {
  "carton-pallet-standards-outbound-operations": {
    title: "Planning an outbound handling job?",
    text: "Share carton and pallet counts, dimensions, labeling needs and the next destination so the receiving and dispatch work can be scoped.",
    serviceSlug: "transportation-cross-docking-canada", query: "crossdock",
  },
  "cross-docking-faster-canadian-distribution": {
    title: "Check the fit for your next transfer",
    text: "Send the origin, destination, freight profile and inbound/outbound windows. Handling requirements and timing need to be confirmed for the specific movement.",
    serviceSlug: "transportation-cross-docking-canada", query: "crossdock",
  },
  "building-clear-warehouse-returns-disposition-process": {
    title: "Scope the returns work before it arrives",
    text: "Include expected volume, inspection instructions, the person who approves exceptions and the permitted inventory outcomes.",
    serviceSlug: "warehousing-fulfillment-canada", query: "warehousing",
  },
  "how-to-scope-returns-inspection-work-before-it-begins": {
    title: "Turn the inspection scope into an inquiry",
    text: "Share the product profile, return volume, required checks and decision contact so the work can be discussed without assuming a disposition outcome.",
    serviceSlug: "warehousing-fulfillment-canada", query: "warehousing",
  },
};

export const featuredServiceInsights: Record<string, string[]> = {
  "transportation-cross-docking-canada": [
    "carton-pallet-standards-outbound-operations",
    "cross-docking-coordination-short-transfer-window",
  ],
  "fba-ecommerce-prep-canada": ["carton-pallet-standards-outbound-operations"],
  "warehousing-fulfillment-canada": ["how-to-scope-returns-inspection-work-before-it-begins"],
};
