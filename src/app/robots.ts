import type { MetadataRoute } from "next";
import { siteIndexable, siteUrl } from "@/lib/site";

/**
 * robots.txt según SITE_INDEXABLE: por defecto bloquea todo (empresa ficticia). El sitemap se
 * declara igual, para demostrar el SEO completo.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: siteIndexable() ? { userAgent: "*", allow: "/", disallow: "/api/" } : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
