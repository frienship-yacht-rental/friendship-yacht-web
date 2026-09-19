import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

/**
 * Static routes only for now. When yacht detail pages land, fetch their slugs
 * here and append them — this file is a Server Component and can await data.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteConfig.url,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/yachts`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
