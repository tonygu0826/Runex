export type Article = {
  slug: string;
  category: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  keyAnswer: string;
  sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>;
  faq: Array<{ question: string; answer: string }>;
};

export const articles: Article[] = [
  {
    slug: "how-to-choose-3pl-warehouse-canada",
    category: "3PL & Warehousing",
    title: "How to Choose a 3PL Warehouse in Canada",
    description: "A practical guide to evaluating Canadian 3PL warehouses, from receiving and inventory control to fulfillment, transportation and communication.",
    excerpt: "The right 3PL should match your freight profile, operating rhythm and growth plan—not just offer empty warehouse space.",
    publishedAt: "2026-07-20",
    readTime: "8 min read",
    keyAnswer: "Choose a Canadian 3PL by testing five areas: service fit, receiving accuracy, inventory visibility, value-added capabilities and transportation coordination. Ask how the provider handles exceptions before comparing price.",
    sections: [
      {
        heading: "Start with operational fit",
        paragraphs: [
          "A 3PL can have a good warehouse and still be the wrong fit for your business. Begin with the freight you actually move: palletized goods, cartons, oversized items, marketplace inventory, returns or a mix of several profiles.",
          "Explain your normal monthly volume, seasonal peaks, receiving pattern and order profile. A useful provider should be able to describe how your freight will move through its operation from arrival to dispatch.",
        ],
        bullets: ["Typical inbound loads and appointment frequency", "Storage method and inventory turnover", "Order volume, cut-off times and destination mix", "Labeling, inspection, repacking or returns work"],
      },
      {
        heading: "Examine the receiving process",
        paragraphs: [
          "Receiving is where inventory problems often begin. Ask how the warehouse confirms quantities, records visible damage, separates exceptions and communicates discrepancies. The answer should be a clear workflow rather than a general promise to be careful.",
          "For time-sensitive freight, confirm how appointments, unloading and cross-docking are coordinated. A strong receiving process reduces later disputes and gives the fulfillment team cleaner inventory to work with.",
        ],
      },
      {
        heading: "Confirm inventory visibility and control",
        paragraphs: [
          "You should understand how stock is identified, located and adjusted. Ask what information appears in the warehouse system, when updates become visible and how cycle counts or inventory corrections are handled.",
          "The goal is not simply to have software. The goal is to make sure the physical process and the system record stay aligned when freight is received, moved, picked, returned or damaged.",
        ],
      },
      {
        heading: "Review value-added services",
        paragraphs: [
          "Many businesses need more than storage. Compare the provider’s ability to perform labeling, kitting, inspection, repacking, pallet work, returns processing, FBA preparation and cross-docking.",
          "Ask who approves non-standard work, how instructions are documented and how the warehouse reports completion. These details matter when a small exception can delay an entire shipment.",
        ],
      },
      {
        heading: "Connect warehousing and transportation",
        paragraphs: [
          "A warehouse may perform well internally but lose time at the transportation handoff. Ask whether the 3PL coordinates pickup and delivery, how it shares shipment status and who owns communication when a carrier appointment changes.",
          "Keeping warehousing and transportation connected can reduce duplicated communication and make it easier to identify the next responsible party.",
        ],
      },
      {
        heading: "Compare communication before price",
        paragraphs: [
          "Rates matter, but unclear communication creates hidden cost. During the evaluation, notice whether the provider asks detailed questions, documents assumptions and gives a direct answer when something is outside its normal process.",
          "Request a rate structure that separates recurring charges from exception work. Then compare the complete operating model—not only the lowest storage rate.",
        ],
      },
    ],
    faq: [
      { question: "What should I ask a Canadian 3PL before signing?", answer: "Ask how it receives freight, records discrepancies, controls inventory, handles peak volume, completes value-added work, coordinates transportation and reports exceptions." },
      { question: "Is the lowest 3PL rate usually the best choice?", answer: "Not necessarily. Compare the total workflow, including handling rules, minimum charges, exception fees, communication and the operational cost of delays or inventory errors." },
      { question: "Can one 3PL handle both warehousing and transportation?", answer: "Yes. Many 3PLs coordinate both services. Confirm which work is performed directly, which work uses carrier partners and who remains responsible for updates." },
    ],
  },
  {
    slug: "fba-prep-canada-workflow",
    category: "FBA & E-commerce",
    title: "FBA Prep in Canada: A Practical Warehouse Workflow",
    description: "Understand how a Canadian warehouse receives, inspects, labels, prepares and dispatches FBA inventory while keeping exceptions visible.",
    excerpt: "A reliable FBA workflow starts before labeling: inbound verification, clear instructions and exception control protect the shipment schedule.",
    publishedAt: "2026-07-18",
    readTime: "7 min read",
    keyAnswer: "A practical FBA prep workflow has six steps: receive, verify, inspect, prepare, quality-check and dispatch. Product-specific requirements can change, so the seller’s current shipment plan and marketplace instructions should remain the final reference.",
    sections: [
      {
        heading: "Receive against a clear inbound plan",
        paragraphs: [
          "Before freight arrives, the warehouse should know the expected cartons or pallets, product references and the work requested. This makes it easier to separate a true discrepancy from incomplete instructions.",
          "The receiving record should capture quantity differences and visible damage before preparation begins.",
        ],
      },
      {
        heading: "Verify product and shipment information",
        paragraphs: [
          "The warehouse matches physical units to the seller’s provided information. Mixed products, unreadable labels or unexpected packaging should move into an exception process instead of continuing automatically.",
          "Marketplace and product requirements vary. The current seller account, shipment plan and destination instructions should be checked before work is released.",
        ],
      },
      {
        heading: "Inspect and prepare units",
        paragraphs: [
          "Preparation may include applying product labels, covering conflicting barcodes, bagging, bundling, adding protective material, repacking or building cartons and pallets to the confirmed instructions.",
          "Instructions should be specific enough that two operators would complete the work the same way. Photos or a confirmed sample can help for unusual products.",
        ],
      },
      {
        heading: "Complete a quality check",
        paragraphs: [
          "A quality check should confirm that the right work was performed on the right quantity. It can also verify carton labels, pallet labels and the separation of different shipment destinations.",
          "When a problem is found, the provider should identify the affected quantity and request a decision rather than holding the entire order without explanation.",
        ],
      },
      {
        heading: "Stage and dispatch",
        paragraphs: [
          "Prepared freight is staged by shipment and kept separate until pickup. Transportation details, appointment requirements and the final piece count should be aligned before release.",
          "The shipment is not complete when preparation ends; it is complete when the next handoff has the correct freight and documents.",
        ],
      },
    ],
    faq: [
      { question: "What does an FBA prep warehouse do?", answer: "It receives inventory and performs requested work such as inspection, labeling, repacking, carton preparation, pallet preparation, staging and transportation coordination." },
      { question: "Who confirms the current FBA requirements?", answer: "The seller’s current marketplace account and shipment plan should be treated as the final reference because requirements may vary by product, shipment and destination." },
      { question: "Can a 3PL handle FBA returns?", answer: "Many 3PLs can receive returns, inspect condition, relabel, repackage, restock or prepare inventory for another disposition. The exact process should be agreed in advance." },
    ],
  },
  {
    slug: "cross-docking-vs-warehousing-canada",
    category: "Distribution",
    title: "Cross-Docking vs. Warehousing: Which Fits Your Freight?",
    description: "Compare cross-docking and traditional warehousing for Canadian distribution, including timing, storage, handling and inventory considerations.",
    excerpt: "Cross-docking prioritizes fast transfer; warehousing prioritizes storage and inventory control. Many operations need a planned combination of both.",
    publishedAt: "2026-07-16",
    readTime: "6 min read",
    keyAnswer: "Use cross-docking when inbound freight has a confirmed outbound plan and should move quickly. Use warehousing when inventory must wait, be stored, picked or prepared. A hybrid plan works when part of the load can move immediately and the balance needs storage.",
    sections: [
      {
        heading: "What cross-docking means",
        paragraphs: [
          "In a cross-dock operation, freight moves from an inbound vehicle to an outbound staging area with little or no storage time. The warehouse may sort, consolidate, deconsolidate or repalletize freight during the transfer.",
          "Cross-docking works best when inbound information, outbound destinations and transportation timing are confirmed before arrival.",
        ],
      },
      {
        heading: "What traditional warehousing adds",
        paragraphs: [
          "Warehousing adds time and control. Inventory is received into a storage location and later picked, prepared and dispatched according to demand.",
          "This model fits goods that need buffer stock, ongoing order fulfillment, inspection, labeling, returns processing or uncertain outbound timing.",
        ],
      },
      {
        heading: "Choose based on timing and certainty",
        paragraphs: ["Cross-docking depends on alignment. If the outbound plan is incomplete, the freight may still need temporary storage and additional handling. Warehousing accepts that timing gap and creates an inventory record to manage it."],
        bullets: ["Use cross-docking for confirmed, time-sensitive transfers", "Use warehousing for stock that must wait or fulfill multiple orders", "Use a hybrid plan when only part of the inbound load is ready to move"],
      },
      {
        heading: "Compare the full handling plan",
        paragraphs: [
          "Do not compare only a cross-dock fee with a storage rate. Include unloading, sorting, pallet work, staging time, appointments, outbound loading and any exception handling.",
          "A good provider should explain what happens if the outbound carrier is late, the piece count is different or part of the freight cannot move as planned.",
        ],
      },
    ],
    faq: [
      { question: "Does cross-docking mean freight is never stored?", answer: "Not always. Cross-docked freight may be staged briefly while it is sorted or waits for the outbound vehicle, but the process is designed to avoid normal long-term storage." },
      { question: "Can one shipment use both cross-docking and warehousing?", answer: "Yes. A warehouse can transfer the freight with a confirmed outbound plan and place the remaining units into storage." },
      { question: "Is cross-docking always cheaper?", answer: "No. Cost depends on sorting, pallet work, timing, appointments and exceptions. It is most efficient when inbound and outbound plans are well aligned." },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
