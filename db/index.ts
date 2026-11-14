import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  const { LEADS_DB } = env as { LEADS_DB?: D1Database };
  if (!LEADS_DB) {
    throw new Error(
      "Cloudflare D1 binding `LEADS_DB` is unavailable. Set the `d1` field in .openai/hosting.json to `LEADS_DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(LEADS_DB, { schema });
}
