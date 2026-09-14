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
      title: "An Old Style Article",
      description: "",
      excerpt: "",
      keywords: ["carrier handoff"],
      operationalBasis: ["Other evidence."],
      keyAnswer: "Another answer.",
    },
  ]);
});

test("rejects a recent article that reuses the same operational basis", () => {
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
  assert.equal(collision.reason, "the same operational basis was used recently");
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
