import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { MARKET_SLUGS, SITE } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  let indicators: { slug: string }[] = [];
  try { indicators = await api.indicators(); } catch { /* 백엔드 지연 시 정적 경로만 */ }
  const u = (p: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" = "daily") =>
    ({ url: `${SITE.url}${p}`, lastModified: now, changeFrequency, priority });
  return [
    u("/", 1.0),
    u("/report/", 0.9),
    u("/indicators/", 0.8),
    ...indicators.map((i) => u(`/indicators/${i.slug}/`, 0.8)),
    ...MARKET_SLUGS.map((s) => u(`/markets/${s}/`, 0.7)),
    u("/about/", 0.3, "monthly"), u("/privacy/", 0.2, "monthly"), u("/terms/", 0.2, "monthly"), u("/contact/", 0.2, "monthly"),
  ];
}
