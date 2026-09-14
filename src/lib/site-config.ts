import { env } from "@/env";

/**
 * Single source of truth for brand and SEO metadata. Imported by the root
 * layout, sitemap and robots so these values are never duplicated.
 */
export const siteConfig = {
  name: "Friendship Yachts",
  shortName: "Friendship",
  description:
    "Friendship Yachts designs and builds performance sailing yachts, combining hand-finished craftsmanship with modern naval architecture.",
  url: env.NEXT_PUBLIC_SITE_URL,
  locale: "en_US",
  twitterHandle: "@friendshipyachts",
} as const;

export type SiteConfig = typeof siteConfig;
