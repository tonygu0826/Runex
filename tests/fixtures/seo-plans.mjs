import { granularBriefs } from "../../scripts/seo-editorial-briefs.mjs";

export function planFor(brief) {
  return {
    briefId: brief.id,
    searchIntent: brief.readerQuestion,
    title: `Planning ${brief.id.replaceAll("-", " ")}`,
    description: `This guide covers ${brief.area} with checks based on the supplied operational instructions.`,
    excerpt: brief.readerQuestion,
    keywords: [brief.id.replaceAll("-", " "), brief.area, `Planning ${brief.id.replaceAll("-", " ")}`],
    keyAnswer: brief.evidence.slice(0, 2).join(" "),
    operationalBasis: brief.evidence,
    outline: [`Define ${brief.id.replaceAll("-", " ")}`, "Check the original input before changing a record", "Resolve ambiguity before completing the task"],
  };
}

export const unitPlan = {
  ...planFor(granularBriefs[0]),
  title: "Mapping Each, Inner-Pack and Case Quantities",
  keywords: ["unit of measure conversion", "case pack quantities", "base unit mapping"],
  outline: ["Name the selling and picking units", "Check the arithmetic with a sample line", "Resolve unclear pack definitions before import"],
};

// Authored test data, never a publishing fallback. It exercises the real word,
// grounding, duplication and claim gates against the repository's full archive.
export function unitDraft() {
  return {
    ...unitPlan,
    category: "Fulfillment",
    sources: [],
    faq: [],
    sections: [
      {
        heading: unitPlan.outline[0],
        paragraphs: [
          "Start the mapping by naming the smallest unit that the product record will count. A hypothetical item might be sold as a single bottle, held in an inner pack and delivered in a larger case. Those labels describe different quantities, even though they refer to the same physical product. Write the base unit next to the item identifier so a reader does not need to infer it from a photograph, a familiar product name or a supplier's abbreviated description.",
          "Next, list the selling unit and the unit used for picking alongside that base unit. If the client sends an order for two cases, the instruction needs to show whether a case contains individual bottles or several inner packs. Do not substitute a customary pack quantity for a confirmed value. Ask the information owner to supply the missing relationship and keep the unconfirmed mapping separate from the record that will be used to prepare actual order lines.",
        ],
      },
      {
        heading: unitPlan.outline[1],
        paragraphs: [
          "Check a hypothetical order line in both directions. If an inner pack contains four base units and a case contains three inner packs, a case represents twelve base units. Two cases would therefore represent twenty-four base units in this example. Label these quantities as a worked example, not as the configuration of a real product. The purpose is to make the multiplication visible so that a reviewer can identify a mistaken relationship before importing an order file.",
          "The reverse check asks which picking quantity corresponds to the computed base-unit total. A total that cannot be expressed as whole cases may need an explicit broken-pack instruction; arithmetic alone does not authorise opening packaging. Compare the proposed result with the selling configuration specified by the client. Document whether the order is intended to request whole cases, loose units or a permitted combination, then check that the input file expresses that choice in the expected field.",
        ],
      },
      {
        heading: unitPlan.outline[2],
        paragraphs: [
          "When a conversion remains unclear, identify the exact relationship that needs confirmation. Asking whether a carton means one inner pack or one outer case is more useful than reporting a general quantity issue. Attach the product reference and the original input value to the question. Keep the affected line from being allocated using an assumed multiplier while the answer is pending. Unrelated, verified product mappings can be reviewed separately rather than being changed to match the ambiguous example.",
          "Once the information owner confirms the intended quantities, update the mapping and repeat the example calculation. The reviewer should be able to move from the original order quantity to its base-unit equivalent without supplying missing assumptions. Preserve a clear distinction between the incoming quantity and the converted value so that a later question can be traced back to the source. Use the checked mapping for the import only after the selling and picking units agree with the instructions.",
        ],
      },
    ],
  };
}
