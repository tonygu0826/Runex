export const contactServices = [
  "Warehousing and storage",
  "E-commerce fulfillment",
  "FBA preparation",
  "Cross-docking",
  "Transportation",
  "Other logistics support",
] as const;

export type ContactResult = {
  ok?: boolean;
  accepted?: boolean;
  receiptId?: string;
  notification?: "accepted" | "pending" | "test";
  measurementEligible?: boolean;
  message?: string;
};

// A form acknowledgement is not a qualified lead or proof of inbox delivery.
// Blocked, test and duplicate requests never create another conversion.
export function shouldMeasureInquiry(result: ContactResult) {
  return result.ok === true && result.accepted === true &&
    result.measurementEligible === true && typeof result.receiptId === "string";
}

export const serviceQueryValues: Record<string, string> = {
  warehousing: "Warehousing and storage",
  fulfillment: "E-commerce fulfillment",
  fba: "FBA preparation",
  crossdock: "Cross-docking",
  transportation: "Transportation",
};
