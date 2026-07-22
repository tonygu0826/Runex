export type ServiceSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LogisticsService = {
  slug: string;
  number: string;
  title: string;
  shortTitle: string;
  metaTitle: string;
  description: string;
  summary: string;
  keyAnswer: string;
  items: string[];
  idealFor: string[];
  planningInputs: string[];
  sections: ServiceSection[];
  faq: Array<{ question: string; answer: string }>;
};

export const services: LogisticsService[] = [
  {
    slug: "warehousing-fulfillment-canada",
    number: "01",
    title: "Warehousing and fulfillment in Canada",
    shortTitle: "Warehousing & fulfillment",
    metaTitle: "Warehousing & Fulfillment Canada | Runex Logistics",
    description: "Canadian warehousing and fulfillment for receiving, storage, inventory control, pick and pack, outbound staging and returns.",
    summary: "Connect receiving, storage, inventory control and order fulfillment through one practical warehouse workflow.",
    keyAnswer: "Runex warehousing and fulfillment connects inbound receiving, storage, inventory control, picking, packing, outbound staging and returns. The workflow is designed around the products, volume, handling requirements and destination mix instead of forcing every operation into the same process.",
    items: ["Inbound receiving", "Storage and inventory control", "Pick and pack", "Outbound staging", "Returns processing"],
    idealFor: ["Importers and distributors", "Direct-to-consumer brands", "Businesses adding warehouse capacity", "Operations with changing order volume"],
    planningInputs: ["Product and packaging profile", "Expected pallet, carton or order volume", "Receiving and storage requirements", "Outbound destinations and handling exceptions"],
    sections: [
      {
        heading: "Receive inventory against a clear plan",
        paragraphs: [
          "Expected quantities, pallet or carton details, handling instructions and timing are documented before freight arrives. The receiving team can then verify what was delivered and separate visible exceptions before they affect available inventory.",
          "That first check creates a reliable starting point for storage, fulfillment and future outbound work.",
        ],
      },
      {
        heading: "Store, pick and pack with inventory control",
        paragraphs: [
          "Inventory is placed into an agreed storage workflow based on product profile, turnover and handling requirements. Physical stock and inventory records remain aligned as goods are received, moved, picked, returned or prepared.",
          "A defined pick-and-pack process keeps product selection, packaging, labeling and exception handling consistent as order volume changes.",
        ],
        bullets: ["Pallet and carton storage", "Inventory movement", "Order picking", "Packing and labeling", "Replenishment support"],
      },
      {
        heading: "Connect outbound staging and returns",
        paragraphs: [
          "Completed orders are staged according to the outbound plan so the transportation handoff receives the correct quantity and documentation.",
          "Returned inventory follows a separate inspection and disposition process before it can re-enter available stock.",
        ],
      },
    ],
    faq: [
      { question: "What does a fulfillment warehouse handle?", answer: "A fulfillment warehouse receives and stores inventory, then picks, packs and stages customer or wholesale orders. It may also handle labeling, replenishment and returns." },
      { question: "How much does warehousing and fulfillment cost?", answer: "Cost depends on receiving volume, storage footprint, inventory turnover, order activity, packaging and special handling. A useful quote separates recurring work from exceptions." },
      { question: "Can Runex support both storage and order fulfillment?", answer: "Yes. Storage, inventory control, pick and pack, staging and transportation coordination can be connected in one operating plan." },
    ],
  },
  {
    slug: "fba-ecommerce-prep-canada",
    number: "02",
    title: "FBA and e-commerce preparation in Canada",
    shortTitle: "FBA & e-commerce prep",
    metaTitle: "FBA & E-commerce Prep Canada | Runex Logistics",
    description: "FBA and e-commerce preparation in Canada for receiving, inspection, labeling, repacking, kitting, carton preparation and dispatch.",
    summary: "Prepare marketplace inventory through controlled receiving, inspection, labeling, repacking, quality checks and dispatch.",
    keyAnswer: "FBA and e-commerce preparation turns inbound inventory into shipment-ready units, cartons or pallets. Runex can connect receiving, quantity verification, inspection, labeling, repacking, quality control, staging and dispatch while using the seller's current marketplace shipment plan as the final reference.",
    items: ["Inbound verification", "Inspection and labeling", "Kitting and repacking", "Carton and pallet prep", "Dispatch staging"],
    idealFor: ["Marketplace sellers importing into Canada", "Brands needing labeling or repacking", "Inventory with product-specific preparation", "Sellers planning replenishment shipments"],
    planningInputs: ["Product list and expected quantities", "Current marketplace shipment plan", "Labeling, packaging and inspection instructions", "Target dispatch timing and exception contacts"],
    sections: [
      {
        heading: "Verify inventory before preparation",
        paragraphs: [
          "Expected products, quantities and preparation instructions are matched to the physical freight before work begins. Mixed products, unreadable labels or visible damage move into an exception process instead of continuing automatically.",
          "Identifying missing information early protects the shipment schedule and prevents repeated rework.",
        ],
      },
      {
        heading: "Prepare units, cartons and pallets",
        paragraphs: [
          "Preparation can include inspection, product labels, covering conflicting barcodes, bagging, bundling, kitting, protective material, repacking, carton labels and pallet work according to confirmed instructions.",
          "For unusual products, photos or an approved sample make the process easier to repeat and quality-check.",
        ],
        bullets: ["Product inspection", "Labeling and relabeling", "Kitting and bundling", "Repacking and protection", "Carton and pallet preparation"],
      },
      {
        heading: "Quality-check, stage and dispatch",
        paragraphs: [
          "A final check confirms that the requested work was completed on the correct quantity and that shipment destinations remain separated.",
          "Marketplace requirements can change, so the current seller-account instructions and shipment plan always take priority over a generic checklist.",
        ],
      },
    ],
    faq: [
      { question: "What services are included in FBA preparation?", answer: "Common services include receiving, quantity checks, inspection, labeling, repacking, protective preparation, carton or pallet preparation, staging and dispatch coordination." },
      { question: "Who confirms current marketplace requirements?", answer: "The seller's current marketplace account and shipment plan should be the final reference because requirements can vary by product, shipment and destination." },
      { question: "Can an FBA prep warehouse handle returns?", answer: "Returns can follow an agreed process for receiving, inspection, relabeling, repacking, restocking or another disposition." },
    ],
  },
  {
    slug: "transportation-cross-docking-canada",
    number: "03",
    title: "Transportation and cross-docking in Canada",
    shortTitle: "Transportation & cross-docking",
    metaTitle: "Transportation & Cross-Docking Canada | Runex",
    description: "Transportation and cross-docking in Canada for unloading, sorting, consolidation, staging, pickups, transfers and delivery coordination.",
    summary: "Move freight through unloading, sorting, staging and transportation with one team coordinating each handoff.",
    keyAnswer: "Transportation and cross-docking connects inbound unloading with sorting, consolidation, brief staging and the next freight movement. It works best when quantities, destinations, pickup timing and exception rules are confirmed before arrival, giving every warehouse and carrier handoff a clear owner.",
    items: ["Inbound unloading", "Sorting and consolidation", "Short-term staging", "Pickup and transfer coordination", "Delivery scheduling"],
    idealFor: ["Import freight with confirmed destinations", "Warehouse-to-warehouse transfers", "Time-sensitive distribution", "Hybrid loads combining transfer and storage"],
    planningInputs: ["Origin, destination and delivery constraints", "Pallet, carton, weight and dimension details", "Transfer, storage or cross-dock requirements", "Pickup timing, documents and exception contacts"],
    sections: [
      {
        heading: "Plan inbound and outbound together",
        paragraphs: [
          "Expected freight, pallet or carton counts, sorting instructions, outbound destinations and pickup timing should be confirmed before the inbound vehicle arrives.",
          "A connected plan makes it easier to identify true exceptions and keep time-sensitive freight moving.",
        ],
      },
      {
        heading: "Unload, sort, consolidate and stage",
        paragraphs: [
          "Freight can move through unloading, destination sorting, consolidation or deconsolidation, pallet handling and short-term outbound staging according to the agreed workflow.",
          "If part of a load is not ready to move, that inventory can enter a separate storage process instead of holding the complete transfer.",
        ],
        bullets: ["Container or trailer unloading", "Destination sorting", "Consolidation and deconsolidation", "Pallet handling", "Short-term staging"],
      },
      {
        heading: "Coordinate pickup, transfer and delivery",
        paragraphs: [
          "Transportation planning is connected to what the warehouse has actually received, prepared and staged. Confirmed quantities, access requirements and appointment details reduce avoidable dock delays.",
          "When timing changes, the operating plan identifies the next action and who communicates the revised expectation.",
        ],
      },
    ],
    faq: [
      { question: "What is the difference between cross-docking and warehousing?", answer: "Cross-docking prioritizes fast inbound-to-outbound transfer with little storage. Warehousing receives inventory into storage so it can wait, be controlled, picked or prepared later." },
      { question: "Can one shipment use cross-docking and storage?", answer: "Yes. Freight with a confirmed outbound plan can transfer quickly while the remaining inventory enters storage." },
      { question: "Can one provider coordinate the warehouse and transportation?", answer: "Yes. A connected provider can align warehouse readiness with pickup, transfer and delivery planning while keeping responsibility for updates clear." },
    ],
  },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}
