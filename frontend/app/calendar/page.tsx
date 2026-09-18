import type { Metadata } from "next";
import AdSlot from "@/components/AdSlot";
import EventTimeline from "@/components/EventTimeline";
import JsonLd from "@/components/JsonLd";
import { api } from "@/lib/api";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const c = await api.calendar();
    const n = c.upcoming[0];
    const title = n ? `경제 일정 - 다음은 ${n.date} ${n.name}` : "경제 이벤트 일정";
    return {
      title,
      description: `FOMC, 미국 CPI, 고용보고서, PCE, 한국은행 금통위 일정과 금리 결정 반영 확률을 매일 갱신합니다. 다음 일정 : ${n?.date ?? "-"} ${n?.name ?? ""}`,
      keywords: ["FOMC 일정", "미국 CPI 발표일", "고용보고서 일정", "금통위 일정", "금리 인상 확률", "경제 캘린더"],
      alternates: { canonical: "/calendar/" },
      openGraph: { images: ["/og.png"], title, url: "/calendar/" },
    };
  } catch { return {}; }
}

export default async function CalendarPage() {
  const c = await api.calendar();
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "ItemList", name: "경제 이벤트 일정",
        itemListElement: c.upcoming.slice(0, 10).map((e, i) => ({
          "@type": "ListItem", position: i + 1,
          item: { "@type": "Event", name: e.name, startDate: e.at_kst, eventStatus: "https://schema.org/EventScheduled", description: e.why },
        })),
      }} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">경제 이벤트 일정과 결정 확률</h1>
        <p className="mt-1 text-sm text-slate-500">
          FOMC · 미국 CPI · 고용보고서 · PCE · GDP · 한국은행 금통위. 지난 일정은 자동으로 빠지고 결과가 붙습니다.
        </p>
      </div>
      <AdSlot variant="top" />
      <EventTimeline upcoming={c.upcoming} past={c.past} note={c.note} />

      <section className="card p-5">
        <h2 className="text-lg font-semibold">전체 일정</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="py-2 font-medium">날짜</th>
                <th className="py-2 font-medium">시각(KST)</th>
                <th className="py-2 font-medium">이벤트</th>
                <th className="py-2 font-medium">출처</th>
              </tr>
            </thead>
            <tbody>
              {c.upcoming.map((e) => (
                <tr key={e.date + e.name} className="border-b border-slate-50 last:border-0">
                  <td className="tnum py-2 pr-3 whitespace-nowrap">{e.date}</td>
                  <td className="tnum py-2 pr-3 text-slate-500 whitespace-nowrap">{e.time_kst}</td>
                  <td className="py-2 pr-3">{e.name}</td>
                  <td className="py-2 text-xs text-slate-500">{e.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-xs leading-5 text-slate-500">
        일정은 연방준비제도, 미국 노동통계국(BLS), 경제분석국(BEA), 한국은행이 공표한 공식 일정입니다. 기관 사정에 따라 변경될 수 있습니다.
      </p>
    </div>
  );
}
