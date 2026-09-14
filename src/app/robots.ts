import type { MetadataRoute } from "next";

import { env } from "@/env";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  // Keep preview and staging deployments out of the index.
  const isProduction = env.NODE_ENV === "production";

  return {
    rules: isProduction
      ? { userAgent: "*", allow: "/", disallow: ["/api/"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
