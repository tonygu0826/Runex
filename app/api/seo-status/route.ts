import { articles } from "../../insights/articles";
import { publicationStatus } from "../../insights/publication-time.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  // Dates prove the future batch reached the deployed Worker without exposing
  // queued titles, slugs or prose through a public preview endpoint.
  return Response.json(publicationStatus(articles), { headers: { "Cache-Control": "no-store" } });
}
