import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSitemapEntries } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const entries = await getSitemapEntries();
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...entries.map(({ iata, slug }) => ({
      url: `${SITE_URL}/${iata.toLowerCase()}${slug ? `/${slug}` : ""}`,
      changeFrequency: "weekly" as const,
      priority: slug ? 0.5 : 0.8,
    })),
  ];
}
