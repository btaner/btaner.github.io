/**
 * Public base URL for metadata, canonical URLs and the sitemap.
 * Set NEXT_PUBLIC_SITE_URL in production; on Vercel it falls back to the production domain.
 */
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000")
).replace(/\/$/, "");
