// These are editorial recommendations, not evidence of Runex capabilities or results.
// Keep historical wording stable: it also identifies coverage published before briefId existed.
export const legacyBriefs = [
  {
    id: "receiving-control",
    area: "warehouse receiving instructions, count checks and damage documentation",
    evidence: [
      "The operating plan starts with the freight profile, expected activity and known exceptions.",
      "Receiving instructions should define identification, count and damage-reporting steps.",
      "Exceptions should be documented before additional handling work proceeds.",
    ],
  },
  {
    id: "kitting-control",
    area: "repeatable kitting and light-assembly workflows for changing order volumes",
    evidence: [
      "Kitting instructions should define components, quantities, labels and the finished-unit identifier.",
      "Component inventory and finished kits need separate, visible counts.",
      "Timing and pricing for value-added work are confirmed case by case.",
    ],
  },
  {
    id: "inventory-exceptions",
    area: "inventory exception reporting, escalation and adjustment approval",
    evidence: [
      "Exceptions should identify the item, quantity, condition and required decision.",
      "A clear escalation owner prevents warehouse work from waiting without direction.",
      "Inventory adjustments should follow documented approval and reconciliation steps.",
    ],
  },
  {
    id: "quote-planning",
    area: "preparing accurate operating information for a 3PL quote",
    evidence: [
      "A useful quote begins with product dimensions, weights, quantities and handling needs.",
      "Inbound frequency, storage profile and outbound order pattern affect the operating plan.",
      "Known exceptions and client-provided instructions should be disclosed before pricing is confirmed.",
    ],
  },
  {
    id: "cross-docking",
    area: "cross-docking coordination when freight has a short transfer window",
    evidence: [
      "Cross-docking requires aligned arrival information, destination instructions and release timing.",
      "Freight condition and count exceptions need an agreed escalation path.",
      "Transportation timing is confirmed for each movement rather than assumed from a generic service promise.",
    ],
  },
  {
    id: "returns-control",
    area: "returns inspection and disposition with clear decision ownership",
    evidence: [
      "Returned inventory needs an identified status before it can be restocked, held or otherwise handled.",
      "Disposition rules should state who can approve each action and what evidence is recorded.",
      "Additional inspection, relabelling or repacking work is scoped before it proceeds.",
    ],
  },
  {
    id: "overflow-control",
    area: "maintaining inventory visibility across primary and overflow storage",
    evidence: [
      "Each storage location needs a consistent identifier and inventory status.",
      "Transfer instructions should preserve item, quantity and destination information.",
      "Cycle-count and reconciliation steps should cover both primary and overflow locations.",
    ],
  },
  {
    id: "marketplace-prep",
    area: "preparing marketplace-bound inventory from current client instructions",
    evidence: [
      "Current client-provided marketplace instructions remain the source of truth for preparation work.",
      "The work order should identify item labels, carton labels, quantities and packaging steps.",
      "Unclear or conflicting instructions should be escalated before inventory is changed.",
    ],
  },
  {
    id: "inbound-readiness",
    area: "inbound appointment readiness and the information a warehouse needs before arrival",
    evidence: [
      "Inbound planning should identify the expected arrival, freight profile and receiving requirements.",
      "Appointment details and shipment references need to match the receiving instructions.",
      "Missing or conflicting information should be resolved before the freight reaches the receiving point.",
    ],
  },
  {
    id: "inventory-status",
    area: "inventory status definitions for available, held, damaged and pending-review stock",
    evidence: [
      "Inventory status should show whether stock is available, held, damaged or awaiting a decision.",
      "Status changes need a clear reason and an identified approval owner.",
      "Physical handling and system records should be reconciled before stock is released.",
    ],
  },
  {
    id: "outbound-readiness",
    area: "outbound order readiness before carrier pickup",
    evidence: [
      "Outbound instructions should identify the order, quantity, packaging and destination requirements.",
      "Pickup timing should be coordinated with the warehouse completion status.",
      "Unresolved quantity, label or packaging exceptions should be escalated before release.",
    ],
  },
  {
    id: "carrier-handoffs",
    area: "documenting carrier handoffs from pickup through delivery confirmation",
    evidence: [
      "A transportation handoff should identify the shipment, pickup status and next responsible party.",
      "Delivery instructions and known exceptions should travel with the shipment record.",
      "Proof of delivery closes the handoff and supports follow-up when an exception remains.",
    ],
  },
  {
    id: "inventory-reconciliation",
    area: "cycle counts and inventory reconciliation without disrupting daily fulfillment",
    evidence: [
      "Count plans should define the items, locations and inventory statuses included in the review.",
      "Differences need to be documented and investigated before records are adjusted.",
      "Reconciliation should preserve a clear link between the physical count and the approved system change.",
    ],
  },
  {
    id: "warehouse-onboarding",
    area: "onboarding a new warehouse account with clear operating responsibilities",
    evidence: [
      "Onboarding should confirm the freight profile, expected activity and required handling instructions.",
      "The client and warehouse need named owners for routine decisions and exceptions.",
      "The operating plan should be reviewed when actual volume or handling differs from the original assumptions.",
    ],
  },
  {
    id: "capacity-changes",
    area: "adjusting warehouse capacity when inbound or outbound volume changes",
    evidence: [
      "Capacity planning depends on expected inventory, activity and timing rather than storage volume alone.",
      "Short-term volume changes should be communicated before they affect receiving or order preparation.",
      "The operating plan should identify which work can be rescheduled and which deadlines require escalation.",
    ],
  },
  {
    id: "multi-location-transfers",
    area: "controlling inventory transfers between warehouse locations",
    evidence: [
      "A transfer instruction should identify the item, quantity, origin and destination.",
      "Inventory status should remain visible while goods are moving between locations.",
      "Receipt confirmation and discrepancy handling complete the transfer record.",
    ],
  },
];

// Each brief answers one distinct reader question. Add new questions and grounded
// recommendations here when the unused pool gets low; never recycle consumed briefs.
export const granularBriefs = [
  {
    id: "unit-of-measure-conversions",
    area: "reconciling each, inner-pack and case quantities in product records",
    readerQuestion: "How should each, inner-pack and case quantities be mapped before order quantities are imported?",
    evidence: [
      "A product record should distinguish the selling unit from the unit used for storage and picking.",
      "Each pack level should have an explicit conversion to the base unit and a checked example quantity.",
      "An ambiguous pack conversion should be resolved before quantities are imported or allocated.",
    ],
  },
  {
    id: "sku-alias-mapping",
    area: "mapping channel-specific item codes to one physical product identifier",
    readerQuestion: "How can channel-specific SKU aliases be mapped without confusing distinct physical products?",
    evidence: [
      "An alias table should identify the channel code and the physical product identifier it refers to.",
      "Similar names do not establish that two item codes represent the same size, colour or pack configuration.",
      "Changes to alias mappings should be checked against open orders before the revised mapping is used.",
    ],
  },
  {
    id: "product-master-revisions",
    area: "changing product dimensions and weights without mixing record versions",
    readerQuestion: "What should happen when a supplier changes product dimensions or weight for an existing SKU?",
    evidence: [
      "A dimension or weight revision should identify the affected product and the packaging level measured.",
      "The revised record should state when it takes effect and whether older stock uses different measurements.",
      "Unverified measurements should be flagged for review before they replace the working product record.",
    ],
  },
  {
    id: "barcode-scan-diagnosis",
    area: "distinguishing unreadable barcodes from unknown or incorrectly mapped codes",
    readerQuestion: "How can a warehouse distinguish an unreadable barcode from a valid code mapped to the wrong item?",
    evidence: [
      "A barcode exception record should distinguish a failed scan from a readable but unrecognised value.",
      "The scanned value should be compared with the expected item and pack-level mapping before a label is replaced.",
      "A replacement label should be checked with a test scan against the intended product record.",
    ],
  },
  {
    id: "order-import-deduplication",
    area: "recognising resubmitted order files without creating duplicate pick instructions",
    readerQuestion: "How should a resubmitted order file be checked before it creates a second pick instruction?",
    evidence: [
      "An order import should retain the client order reference and a distinguishable submission reference.",
      "A repeated order reference should be compared with accepted line details before a second instruction is released.",
      "A rejected submission should be recorded separately from a successfully accepted order.",
    ],
  },
  {
    id: "picked-order-cancellation",
    area: "cancelling an order after goods have been picked but before dispatch",
    readerQuestion: "What must be checked before cancelling an order that has already been picked?",
    evidence: [
      "A cancellation request should be checked against the order's current physical stage, not just its recorded status.",
      "Picked goods should be traced to their staging or packing position before a cancellation is confirmed.",
      "Any return of picked goods to storage should be linked to the cancelled order and verified quantity.",
    ],
  },
  {
    id: "packed-order-address-change",
    area: "reconciling shipping documents after a packed order's destination changes",
    readerQuestion: "How should an address change be handled after an order has been packed and labelled?",
    evidence: [
      "An address amendment should identify the order and whether a shipping label has already been produced.",
      "Superseded destination labels and documents should be removed from use before amended documents are attached.",
      "The final parcel and its shipment record should be checked against the same approved destination.",
    ],
  },
  {
    id: "partial-shipment-permissions",
    area: "defining when an incomplete order may be split into separate shipments",
    readerQuestion: "Which instructions are needed before an order with missing lines can ship partially?",
    evidence: [
      "Partial-shipment instructions should distinguish lines that may ship separately from items that must remain together.",
      "A split should retain a link between dispatched quantities and the original order lines.",
      "The remaining quantities should have an explicit next action rather than being treated as a completed order.",
    ],
  },
  {
    id: "backorder-release-sequence",
    area: "allocating replenished stock among waiting orders using an explicit priority rule",
    readerQuestion: "How should newly available units be assigned when several backorders are waiting for the same SKU?",
    evidence: [
      "A backorder release rule should specify how waiting orders are prioritised when supply is insufficient.",
      "Reserved quantities should be distinguished from quantities available for newly received orders.",
      "An allocation review should record which order lines received stock and which remain unfilled.",
    ],
  },
  {
    id: "sku-substitution-permission",
    area: "documenting whether an alternate product can fulfil an unavailable order line",
    readerQuestion: "What approval is needed before an unavailable order item is replaced with a different SKU?",
    evidence: [
      "A substitution instruction should identify the original item, permitted alternate and applicable order lines.",
      "An alternate should not be inferred solely from similar product descriptions or packaging.",
      "The shipment record should preserve the distinction between the requested item and the item actually supplied.",
    ],
  },
  {
    id: "packaging-consumables-replenishment",
    area: "planning replenishment of cartons, inserts and other packing consumables",
    readerQuestion: "How should packaging consumables be replenished without confusing them with saleable inventory?",
    evidence: [
      "Packaging consumables should have identifiable stock records separate from saleable product quantities.",
      "A replenishment review should compare expected packing use with available material and incoming supply.",
      "An unavailable packaging material needs an agreed alternative or a decision to hold the affected work.",
    ],
  },
  {
    id: "reusable-container-balances",
    area: "tracking reusable totes and containers sent out and expected back",
    readerQuestion: "How can reusable tote balances be reconciled across dispatches and container returns?",
    evidence: [
      "A reusable-container record should separate container quantities from the products carried inside them.",
      "Dispatch and return entries should identify the counterparty, container type and quantity involved.",
      "A container balance review should distinguish outstanding returns from confirmed losses or damaged units.",
    ],
  },
  {
    id: "kit-instruction-revisions",
    area: "separating old and revised assembly instructions during a kit design change",
    readerQuestion: "How should a changed kit specification be introduced when some units have already been assembled?",
    evidence: [
      "A revised kit instruction should carry a version identifier and an effective work-order boundary.",
      "Units assembled under the earlier version should be identified before revised instructions are introduced.",
      "Any rework of earlier kits should be separately authorised instead of inferred from the new specification.",
    ],
  },
  {
    id: "lot-code-transcription",
    area: "preserving supplier lot-code text when entering product records",
    readerQuestion: "How should supplier lot codes be captured without losing leading zeros or changing their meaning?",
    evidence: [
      "A lot-code entry should preserve the supplier's full identifier, including leading zeros and separators.",
      "Unclear characters should be checked against the original label rather than guessed during transcription.",
      "A correction should retain a reference to the original entry and the label used to verify it.",
    ],
  },
  {
    id: "date-field-ambiguity",
    area: "resolving ambiguous date formats on product labels and import files",
    readerQuestion: "How should an ambiguous date such as 04/05 be resolved before it enters a product record?",
    evidence: [
      "A date field should identify both the date's meaning and the format supplied by the client.",
      "An ambiguous day-and-month order should be confirmed with the information owner before conversion.",
      "A converted date should remain traceable to the original label or source file.",
    ],
  },
  {
    id: "serial-number-order-links",
    area: "associating individual serial numbers with dispatched order lines",
    readerQuestion: "What records connect an individual serial number to the order line on which it was dispatched?",
    evidence: [
      "A serial-number capture instruction should specify which items require individual identifiers to be recorded.",
      "Each captured identifier should be associated with the relevant order line and physical unit.",
      "A missing or duplicated serial entry should be reviewed before the associated record is marked complete.",
    ],
  },
  {
    id: "packing-photo-instructions",
    area: "specifying useful packing photographs without creating an unstructured image archive",
    readerQuestion: "What should a packing-photo instruction specify so each image can be matched to the right parcel?",
    evidence: [
      "A packing-photo instruction should state the feature to document and the point in packing when it is visible.",
      "Each image should be linked to a parcel or order reference rather than relying on upload sequence.",
      "Image access and retention expectations should be agreed with the client before routine capture begins.",
    ],
  },
  {
    id: "rework-first-sample-approval",
    area: "checking a first relabelling or repacking sample before batch work proceeds",
    readerQuestion: "How should a first completed rework sample be approved before the remaining batch is processed?",
    evidence: [
      "A sample review should compare the completed unit with the current rework instruction.",
      "The approval record should identify the instruction version and the sample that was reviewed.",
      "Changes requested during sample review should be reflected in the working instruction before batch processing resumes.",
    ],
  },
  {
    id: "seasonal-sku-retirement",
    area: "retiring a seasonal product code while open orders or residual units remain",
    readerQuestion: "What should be checked before deactivating a seasonal SKU that still has stock or open orders?",
    evidence: [
      "A product-code retirement review should identify residual stock, open orders and pending receipts.",
      "Deactivation for new orders should be distinguished from deleting the identifier needed for historical records.",
      "Remaining units should receive a documented instruction rather than becoming unassigned after code retirement.",
    ],
  },
  {
    id: "warehouse-export-field-mapping",
    area: "agreeing inventory export fields before changing reporting systems",
    readerQuestion: "How should inventory export fields be mapped before a report is consumed by a different system?",
    evidence: [
      "An export mapping should define each field's meaning, unit and permitted empty-value treatment.",
      "A sample export should be checked for preserved identifiers and consistent row-level interpretation.",
      "The receiving team should confirm the mapping before the export replaces an existing reporting input.",
    ],
  },
  {
    id: "carton-content-amendments",
    area: "updating carton-level contents after goods are moved between packed cartons",
    readerQuestion: "Which records need to change when items are moved between cartons after packing?",
    evidence: [
      "A carton-content amendment should identify the source carton, destination carton and moved quantities.",
      "The revised carton records should reconcile to the unchanged or separately amended order total.",
      "Documents describing carton contents should be checked for obsolete versions after repacking.",
    ],
  },
  {
    id: "promotional-insert-versions",
    area: "controlling date-limited promotional inserts at the packing station",
    readerQuestion: "How should a new promotional insert replace an expired version without mixing the two in orders?",
    evidence: [
      "An insert instruction should identify the campaign version and the orders to which it applies.",
      "Superseded inserts should be separated from the material available at the active packing position.",
      "A changeover check should verify the first affected order against the revised insert instruction.",
    ],
  },
  {
    id: "purchase-order-amendments",
    area: "distinguishing revised purchase orders from additional expected receipts",
    readerQuestion: "How can a revised purchase order replace expected quantities without being counted as a second receipt?",
    evidence: [
      "A purchase-order revision should identify the original reference, revision and affected line quantities.",
      "Already received quantities should be distinguished from the balance still expected under the revised instruction.",
      "The prior expectation should be marked superseded when the amendment replaces rather than adds to it.",
    ],
  },
  {
    id: "stock-reservation-expiry",
    area: "releasing time-limited inventory reservations for orders that have not progressed",
    readerQuestion: "What should be checked before a stale inventory reservation is released for other orders?",
    evidence: [
      "A reservation rule should identify the order, reserved quantity and condition for review or expiry.",
      "Physical picking activity should be checked before a reservation is released in the records.",
      "A release should record the quantity made available and the next status of the original order.",
    ],
  },
];

export const editorialBriefs = [...legacyBriefs, ...granularBriefs];
