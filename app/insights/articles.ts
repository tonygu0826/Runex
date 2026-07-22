export type Article = {
  slug: string;
  category: string;
  title: string;
  description: string;
  excerpt: string;
  keywords?: string[];
  publishedAt: string;
  readTime: string;
  keyAnswer: string;
  sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[] }>;
  faq: Array<{ question: string; answer: string }>;
};

export const articles: Article[] = [
  {
    "slug": "planning-overflow-storage-without-losing-inventory-visibility",
    "category": "3PL & Warehousing",
    "title": "Planning Overflow Storage Without Losing Inventory Visibility",
    "description": "Learn how to manage overflow storage in Canadian warehousing while keeping real-time inventory visibility across multiple sites.",
    "excerpt": "Overflow storage doesn't have to mean blind spots. Practical strategies for maintaining inventory accuracy when space runs out.",
    "publishedAt": "2026-07-22",
    "readTime": "5 min read",
    "keyAnswer": "Overflow storage is temporary space used when your primary warehouse reaches capacity. To maintain inventory visibility, you need a unified warehouse management system (WMS) that treats overflow locations as part of your network, not a separate silo. Use cycle counting, barcode scanning, and real-time data syncing to track stock across all sites.",
    "sections": [
      {
        "heading": "Why Overflow Storage Happens in Canadian Logistics",
        "paragraphs": [
          "Seasonal demand, supplier delays, or a sudden spike in orders can push your primary warehouse past its limit. In Canada, harsh winters or port congestion in Vancouver or Montreal often force businesses to secure extra space on short notice. The result: inventory spread across multiple locations, sometimes without a clear system to track it.",
          "Overflow storage is not inherently bad. It can be a cost-effective way to handle peaks without committing to a larger permanent facility. The challenge is preventing that extra space from becoming a black hole where stock disappears from your records. Losing visibility leads to overselling, delayed shipments, and frustrated customers.",
          "The key is to plan for overflow before you need it. That means choosing a warehouse partner or internal process that treats temporary space as an extension of your main operation, not a separate afterthought."
        ]
      },
      {
        "heading": "The Core Problem: Fragmented Inventory Data",
        "paragraphs": [
          "When overflow storage is managed manually or with a different system than your primary warehouse, data splits. Your main WMS might show 500 units on hand, but 200 of them are sitting in a trailer or a third-party overflow site not integrated with your system. That mismatch creates risk.",
          "Common symptoms include:",
          "A buyer might ask: 'If I use overflow storage, how do I know my inventory counts are accurate across all locations?' The honest answer is that without integration, you don't. That's why the first step in any overflow plan is ensuring your WMS can handle multiple locations, ideally with real-time updates."
        ],
        "bullets": [
          "Orders get allocated to stock that is actually in overflow, causing picking delays.",
          "Customer service promises availability based on outdated totals.",
          "Replenishment decisions are made on incomplete data, leading to stockouts or excess."
        ]
      },
      {
        "heading": "Designing a Unified Overflow Strategy",
        "paragraphs": [
          "Start by defining your overflow locations in your WMS as distinct bins or zones. Whether it's a separate room, a trailer, or a different building, each location needs a unique identifier. This allows the system to track inventory by location and allocate orders from the most efficient spot.",
          "Next, set up rules for when overflow is used. For example, you might configure your WMS to automatically move stock to overflow when primary bins exceed 90% capacity. This prevents manual guesswork and ensures consistency.",
          "But rules alone aren't enough. You need a process for physical moves. Every time stock is transferred to overflow, it must be scanned into the new location. No shortcuts. If you skip scanning, the system thinks the stock is still in the primary location, and you lose visibility."
        ]
      },
      {
        "heading": "Cycle Counting Across Multiple Sites",
        "paragraphs": [
          "Cycle counting is your safety net. Instead of a full physical inventory once a year, you count a portion of your stock regularly. For overflow storage, increase the frequency of counts. High-value or fast-moving items in overflow should be counted weekly or even daily.",
          "The goal is to catch discrepancies early. If your system says 50 units are in overflow but a count finds only 48, you can investigate before the gap widens. This is especially important when overflow is off-site or managed by a third party.",
          "One practical approach: use a mobile scanner that syncs with your WMS in real time. The counter scans each item or bin, and the system updates immediately. This eliminates the lag between counting and data entry, which is a common source of errors."
        ]