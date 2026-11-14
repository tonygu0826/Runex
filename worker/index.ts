/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { handleContactRequest, type ContactBindings } from "./contact";

interface Env extends ContactBindings {
  ASSETS: Fetcher;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.protocol === "http:" && url.hostname !== "localhost") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/contact") {
      return handleContactRequest(request, env);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const response = await handler.fetch(request, env, ctx);
    // A warm Worker and CDN must re-evaluate the release clock on every request,
    // including pre-release 404s and RSC navigations. Preserve streaming bodies.
    if (url.pathname === "/insights" || url.pathname.startsWith("/insights/") ||
        url.pathname.startsWith("/solutions/") || url.pathname === "/sitemap.xml" ||
        url.pathname === "/llms.txt" || url.pathname === "/api/seo-status") {
      const uncached = new Response(response.body, response);
      uncached.headers.set("Cache-Control", "no-store");
      uncached.headers.set("CDN-Cache-Control", "no-store");
      uncached.headers.set("Cloudflare-CDN-Cache-Control", "no-store");
      return uncached;
    }
    return response;
  },
};

export default worker;
