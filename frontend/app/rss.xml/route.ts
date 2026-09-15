// 네이버 서치어드바이저 RSS 제출용 피드
import { api } from "@/lib/api";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 3600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const items: string[] = [];
  try {
    const r = await api.report();
    const date = new Date(`${r.date}T07:00:00+09:00`).toUTCString();
    items.push(`<item><title>${esc(`${r.date} 거시경제 브리핑 - ${r.headline}`)}</title><link>${SITE.url}/report/</link><guid isPermaLink="false">report-${r.date}</guid><pubDate>${date}</pubDate><description>${esc(r.paragraphs.join(" "))}</description></item>`);
    const list = await api.indicators();
    for (const i of list) {
      items.push(`<item><title>${esc(`${i.short} 오늘 수치와 해석`)}</title><link>${SITE.url}/indicators/${i.slug}/</link><guid isPermaLink="false">ind-${i.slug}-${r.date}</guid><pubDate>${date}</pubDate><description>${esc(i.name)}</description></item>`);
    }
  } catch { /* 빈 피드 */ }
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(SITE.name)}</title><link>${SITE.url}/</link><description>${esc(SITE.tagline)}</description><language>ko</language>${items.join("")}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
