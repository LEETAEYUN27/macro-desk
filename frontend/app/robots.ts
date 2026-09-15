import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "Yeti", allow: "/" },            // 네이버 검색 로봇
      { userAgent: "Mediapartners-Google", allow: "/" }, // 애드센스 크롤러
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
