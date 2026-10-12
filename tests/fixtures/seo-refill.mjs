export function refillCandidates() {
  const input = [
    {
      area: "distinguishing supplier-scoped shipment references",
      readerQuestion: "How should identical shipment reference numbers from different suppliers be distinguished in a warehouse lookup?",
      foundationRefs: ["entity-identity", "reference-context"],
      evidence: [
        "A shipment lookup should preserve the sender alongside the shipment reference used by that sender.",
        "Matching reference numbers from different suppliers should be treated as separate shipment records unless their business context confirms they are one shipment.",
        "A search result should show the supplier context before a warehouse selects the record to use.",
      ],
      title: "Distinguishing Shipment References Shared by Different Suppliers",
      description: "Match shipment reference numbers with their supplier context before selecting a warehouse record or linking a delivery.",
      excerpt: "Keep supplier context with repeated shipment numbers so a lookup does not merge unrelated freight.",
      keywords: ["supplier-scoped shipment references", "reference collision lookup", "sender context in freight records"],
      outline: ["Identify the sender's reference context", "Check matching references without merging records", "Show the distinction in warehouse lookup results"],
    },
    {
      area: "separating optional packing preferences from required task steps",
      readerQuestion: "How should a warehouse work instruction distinguish optional customer preferences from required packing steps?",
      foundationRefs: ["instruction-scope", "permissions-boundaries"],
      evidence: [
        "A packing instruction should mark which steps are required and which preferences may be applied when their stated conditions are met.",
        "An optional presentation preference should not override a required packing instruction without a recorded approval for the change.",
        "The task completion record should distinguish required steps performed from optional preferences that were not applicable.",
      ],
      title: "Separating Optional Packing Preferences from Required Steps",
      description: "Mark required packing steps and optional preferences separately so a warehouse can confirm completion without assuming extra authorisation.",
      excerpt: "Distinguish required packing steps from conditional preferences before work is completed or altered.",
      keywords: ["optional packing preferences", "required task completion steps", "conditional presentation instruction"],
      outline: ["Mark required steps and conditional preferences", "Confirm permission before overriding an instruction", "Record completion without implying an optional task occurred"],
    },
  ];
  return input.map(({ title, description, excerpt, keywords, outline, ...brief }) => ({ ...brief,
    plan: { searchIntent: brief.readerQuestion, title, description, excerpt, keywords, keyAnswer: brief.evidence.slice(0, 2).join(" "), operationalBasis: brief.evidence, outline } }));
}
