import assert from "node:assert/strict";
import test from "node:test";

import { extractExistingArticleSignals, findTopicCollision, slugifyTitle } from "../scripts/seo-quality.mjs";

test("builds short, complete slugs from long titles", () => {
  assert.equal(
    slugifyTitle("When Volume Shifts: A Practical Way to Adjust Warehouse Capacity Without Surprises"),
    "volume-shifts-practical-way-adjust-warehouse-capacity-surprises",
  );
  assert.equal(
    slugifyTitle("How to Define Inventory Statuses So Warehouse Teams Know What They Can and Cannot Touch"),
    "define-inventory-statuses-warehouse-teams-know-cannot-touch",
  );
});

test("never cuts through a word when a slug exceeds the limit", () => {
  const slug = slugifyTitle("Preparing Inbound Shipments for a Smoother Warehouse Receiving Experience With Detailed Instructions", 48);

  assert.ok(slug.length <= 48);
  assert.equal(slug, "preparing-inbound-shipments-smoother-warehouse");
  assert.doesNotMatch(slug, /-$/);
});

test("extracts quality signals from quoted and unquoted article records", () => {
  const source = `export const articles: Article[] = [
    {
      "slug": "new-style",
      "title": "A New Style Article",
      "searchIntent": "What practical question does this article answer?",
      "keywords": ["inventory status", "warehouse control"],
      "operationalBasis": ["Evidence one.", "Evidence two."],
      "keyAnswer": "A direct answer."
    },
    {
      slug: "old-style",
      title: "An Old Style Article",
      keywords: ["carrier handoff"],
      operationalBasis: ["Other evidence."],
      keyAnswer: "Another answer.",
    },
  ];`;

  assert.deepEqual(extractExistingArticleSignals(source), [
    {
      slug: "new-style",
      briefId: "",
      searchIntent: "What practical question does this article answer?",
      title: "A New Style Article",
      description: "",
      excerpt: "",
      keywords: ["inventory status", "warehouse control"],
      operationalBasis: ["Evidence one.", "Evidence two."],
      keyAnswer: "A direct answer.",
    },
    {
      slug: "old-style",
      briefId: "",
      searchIntent: "",
      title: "An Old Style Article",
      description: "",
      excerpt: "",
      keywords: ["carrier handoff"],
      operationalBasis: ["Other evidence."],
      keyAnswer: "Another answer.",
    },
  ]);
});

test("rejects an article that reuses the same operational basis", () => {
  const evidence = [
    "Inventory status should show whether stock is available, held, damaged or awaiting a decision.",
    "Status changes need a clear reason and an identified approval owner.",
  ];
  const collision = findTopicCollision(
    {
      briefId: "inventory-status",
      title: "How to Define Inventory Statuses So Warehouse Teams Know What They Can Touch",
      description: "Define stock statuses and approval ownership.",
      excerpt: "A warehouse guide to stock status decisions.",
      keywords: ["inventory status definitions", "warehouse approval"],
      keyAnswer: "Statuses determine whether stock can move.",
      operationalBasis: evidence,
    },
    [
      {
        slug: "existing-inventory-statuses",
        title: "Defining Inventory Statuses to Keep Warehouse Decisions Moving",
        description: "Clear inventory status definitions help warehouses avoid delays.",
        excerpt: "Define available, held, damaged and pending-review stock.",
        keywords: ["inventory status", "warehouse stock status", "inventory approval workflow"],
        keyAnswer: "Inventory statuses show whether stock is available or held.",
        operationalBasis: evidence,
      },
    ],
  );

  assert.ok(collision);
  assert.equal(collision.existing.slug, "existing-inventory-statuses");
  assert.equal(collision.reason, "the same operational basis and search intent were already used");
});

test("rejects a matching search intent even when the duplicate is outside the recent window", () => {
  const evidence = [
    "Returned inventory needs an identified status before it can be restocked, held or otherwise handled.",
    "Disposition rules should state who can approve each action and what evidence is recorded.",
  ];
  const unrelated = Array.from({ length: 12 }, (_, index) => ({
    slug: `unrelated-${index}`,
    title: `Unrelated Warehouse Topic ${index}`,
    description: "A different operating subject.",
    excerpt: "No overlap with returns inspection.",
    keywords: ["warehouse planning"],
    keyAnswer: "This article covers a different workflow.",
    operationalBasis: ["Different evidence."],
  }));
  const collision = findTopicCollision(
    {
      briefId: "returns-control",
      title: "How to Scope Returns Inspection Work Before It Begins",
      description: "Define inspection work and approval steps for returned inventory.",
      excerpt: "Scope inspection, evidence and disposition ownership before handling starts.",
      keywords: ["returns inspection", "disposition approval", "returned inventory"],
      keyAnswer: "Assign a status and approval owner before handling returned stock.",
      operationalBasis: evidence,
    },
    [
      ...unrelated,
      {
        slug: "returns-disposition-workflow-decision-ownership",
        title: "Assigning Decision Ownership in Returns Disposition",
        description: "Define return statuses, approvals and recorded evidence.",
        excerpt: "Keep returned inventory moving through a clear disposition workflow.",
        keywords: ["returns disposition", "decision ownership", "returned inventory"],
        keyAnswer: "Give each return a status and name the person who approves its disposition.",
        operationalBasis: evidence,
      },
    ],
  );

  assert.ok(collision);
  assert.equal(collision.existing.slug, "returns-disposition-workflow-decision-ownership");
  assert.equal(collision.reason, "the same operational basis and search intent were already used");
});

test("allows an article with a distinct brief and search intent", () => {
  const collision = findTopicCollision(
    {
      briefId: "carrier-handoffs",
      title: "Recording Carrier Handoffs from Pickup to Delivery",
      description: "Document responsibility when freight changes hands.",
      excerpt: "Capture pickup, exceptions and proof of delivery.",
      keywords: ["carrier handoff", "proof of delivery"],
      keyAnswer: "A handoff record names the next responsible party.",
      operationalBasis: ["Proof of delivery closes the handoff."],
    },
    [
      {
        slug: "inventory-statuses",
        briefId: "inventory-status",
        title: "Defining Inventory Statuses for Warehouse Control",
        description: "Define available, held and damaged inventory.",
        excerpt: "A practical inventory status guide.",
        keywords: ["inventory status", "warehouse approval"],
        keyAnswer: "Statuses determine whether stock can move.",
        operationalBasis: ["Status changes need an approval owner."],
      },
    ],
  );

  assert.equal(collision, null);
});

test("recognises the same recorded reader question even with changed metadata", () => {
  const searchIntent = "How should supplier lot codes preserve leading zeros during transcription?";
  const collision = findTopicCollision(
    { title: "Checking Vendor Batch Identifiers", briefId: "new-id", searchIntent },
    [{ title: "Preserving Product Code Text", briefId: "old-id", searchIntent }],
  );
  assert.ok(collision);
});
