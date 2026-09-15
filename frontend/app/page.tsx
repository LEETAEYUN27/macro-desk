import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import { Gauge, LineChart, ScoreBar } from "@/components/charts";
import MarketTable from "@/components/MarketTable";
import { api } from "@/lib/api";
import { asofKST, pct, tone } from "@/lib/format";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  // 검색 결과·SNS 미리보기에 오늘의 점수가 나타나도록 동적 설정
  try {
    const d = await api.dashboard();
    const t = `오늘의 경제 안정성 ${d.stability.score.toFixed(1)}점(${d.stability.label}) - ${SITE.name}`;
    const desc = `${d.insight.headline}. ${d.insight.paragraphs[1] ?? ""}`.slice(0, 155);
    return { title: { absolute: t }, description: desc, openGraph: { images: ["/og.png"], title: t, description: desc }, twitter: { title: t, description: desc } };
  } catch {
    return {};
  }
}

const AXIS_LINK: Record<string, string> = {
  "침체": "recession-probability", "물가": "core-cpi", "금융여건": "nfci", "수익률곡선": "yield-curve",
  "시장 스트레스": "vix", "고용": "unemployment", "시장 밸류에이션": "shiller-cape",
};
const axisSlug = (name: string) => Object.entries(AXIS_LINK).find(([k]) => name.startsWith(k))?.[1];

export default async function Home() {
  const d = await api.dashboard();
  const st = d.stability;
  const ro = d.rate_odds;
  const c = d.concentration;

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">오늘의 글로벌 경제 관제실</h1>
            <p className="mt-1 text-sm text-slate-500">기준 {asofKST(d.asof)} · 금리·물가·고용·신용·변동성·밸류에이션 종합</p>
          </div>
          {d.fallback && <span className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">원천 수집 지연 - 직전 스냅샷 표시 중</span>}
        </div>

        <AdSlot variant="top" />

        {/* 1. 안정성 + 자동 해설 */}
        <section className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <div className="card flex flex-col items-center p-5">
            <h2 className="self-start text-[15px] font-semibold">경제 안정성 점수</h2>
            <p className="self-start text-xs text-slate-500">100 = 안정 · 7개 축 단순 평균</p>
            <div className="mt-3 flex w-full justify-center"><Gauge score={st.score} label={st.label} /></div>
            <ul className="mt-4 w-full space-y-2.5">
              {st.components.map((cp) => {
                const slug = axisSlug(cp.name);
                const name = cp.name.split(" (")[0];
                return (
                  <li key={cp.name}>
                    <div className="mb-1 flex justify-between text-[13px]">
                      {slug ? <Link href={`/indicators/${slug}/`} className="text-slate-700 hover:text-brand-700 hover:underline">{name}</Link> : <span>{name}</span>}
                      <span className="tnum font-semibold">{cp.score.toFixed(0)}</span>
                    </div>
                    <ScoreBar score={cp.score} />
                  </li>
                );
              })}
            </ul>
          </div>

          <article className="card overflow-hidden">
            <div className="bg-gradient-to-r from-brand-700 to-brand-500 px-5 py-3 text-white">
              <div className="text-[11px] font-medium opacity-80">데이터 기반 자동 해설</div>
              <h2 className="text-[16px] font-semibold leading-snug">{d.insight.headline}</h2>
            </div>
            <div className="prose-ko px-5 py-4 text-[14.5px]">
              {d.insight.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <ul className="mx-5 mb-4 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-700">
              {d.insight.bullets.map((b, i) => <li key={i} className="flex gap-2"><span className="text-brand-600">✓</span><span>{b}</span></li>)}
            </ul>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">
              <span>{d.insight.method}</span>
              <Link href="/report/" className="shrink-0 font-medium text-brand-700 hover:underline">브리핑 전문</Link>
            </div>
          </article>
        </section>

        {/* 2. 핵심 지표 타일 */}
        <section aria-labelledby="kpi">
          <h2 id="kpi" className="sr-only">핵심 거시 지표</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {st.metrics.map((m) => (
              <div key={m.name} className="card px-3.5 py-3">
                <div className="truncate text-xs text-slate-500">{m.name.replace("−", "-")}</div>
                <div className="tnum mt-1 text-lg font-bold">{m.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. 금리 확률 + 쏠림 */}
        <section className="grid gap-5 lg:grid-cols-2">
          {ro && (
            <div className="card">
              <div className="card-h"><h2 className="card-t">FOMC 금리 결정 반영 확률</h2><span className="text-xs text-slate-500">{ro.meeting}</span></div>
              <div className="p-4">
                <div className="flex h-9 overflow-hidden rounded-lg">
                  {ro.outcomes.map((o) => (
                    <div key={o.key} style={{ width: `${Math.max(o.prob, 6)}%` }}
                      className={`flex items-center justify-center text-xs font-semibold text-white ${o.key === "hike" ? "bg-rose-500" : o.key === "cut" ? "bg-blue-500" : "bg-slate-400"}`}>
                      {o.prob}%
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                  {ro.outcomes.map((o) => <span key={o.key}>{o.label} {o.prob}%</span>)}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-3">
                  {ro.path.map((p) => (<div key={p.label}><dt className="text-xs text-slate-500">{p.label}</dt><dd className="tnum font-semibold">{p.v}</dd></div>))}
                </dl>
                <p className="mt-3 text-xs leading-5 text-slate-500">{ro.method}</p>
              </div>
            </div>
          )}
          {c && (
            <div className="card">
              <div className="card-h">
                <h2 className="card-t"><Link href="/indicators/market-concentration/" className="hover:underline">미국 증시 쏠림 지표</Link></h2>
                <span className={`rounded px-2 py-0.5 text-xs ${c.alert ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{c.level} · {c.trend}</span>
              </div>
              <div className="p-4">
                <div className="flex items-baseline gap-3">
                  <span className="tnum text-2xl font-bold">{c.last > 0 ? "+" : ""}{c.last.toFixed(1)}%p</span>
                  <span className="text-xs text-slate-500">백분위 {c.pctile.toFixed(0)}% · 3개월 {c.chg_3m !== null ? `${c.chg_3m > 0 ? "+" : ""}${c.chg_3m.toFixed(1)}%p` : "-"}</span>
                </div>
                <LineChart data={c.series} unit="%p" height={230} w={440} zeroLine />
                <p className="text-xs text-slate-500">{c.method}</p>
              </div>
            </div>
          )}
        </section>

        <AdSlot variant="inArticle" />

        {/* 4. 등락 상위 */}
        <section className="grid gap-5 md:grid-cols-2">
          {(["up", "down"] as const).map((k) => (
            <div key={k} className="card">
              <div className="card-h"><h2 className="card-t">전일 {k === "up" ? "상승" : "하락"} 상위</h2></div>
              <ul className="divide-y divide-slate-50 px-4 py-1">
                {d.movers[k].map((m) => (
                  <li key={m.name} className="flex justify-between py-2 text-sm">
                    <span>{m.name} <span className="text-xs text-slate-400">{m.group}</span></span>
                    <span className={`tnum font-semibold ${tone(m.chg)}`}>{pct(m.chg)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* 5. 시장 그룹 */}
        {d.groups.map((g) => (
          <section key={g.key} className="card">
            <div className="card-h">
              <h2 className="card-t">{g.label}</h2>
              <Link href={`/markets/${g.slug}/`} className="text-xs font-medium text-brand-700 hover:underline">전체 보기</Link>
            </div>
            <MarketTable items={g.items} />
          </section>
        ))}

        {/* 6. 일정 */}
        <section className="card">
          <div className="card-h"><h2 className="card-t">주요 일정</h2></div>
          <ul className="divide-y divide-slate-50">
            {d.events.map((e) => (
              <li key={e.name} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[120px_1fr]">
                <span className="tnum font-medium text-brand-700">{e.date}</span>
                <span><span className="font-medium">{e.name}</span><span className="block text-xs text-slate-500">{e.why}</span></span>
              </li>
            ))}
          </ul>
        </section>

        {/* 7. 13F */}
        <section className="card">
          <div className="card-h"><h2 className="card-t">주요 기관 13F 상위 보유</h2><span className="text-xs text-slate-500">SEC EDGAR · 분기 말 기준 최대 45일 지연</span></div>
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
            {d.institutions.map((i) => (
              <div key={i.key}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{i.label}</h3>
                  <span className="text-[11px] text-slate-400">{i.report_date}</span>
                </div>
                <p className="text-xs text-slate-500">
                  ${(i.total_value_usd / 1e9).toLocaleString("en-US", { maximumFractionDigits: 1 })}B
                  {d.usdkrw ? ` (약 ${(i.total_value_usd * d.usdkrw / 1e12).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}조 원)` : ""} · {i.n_positions.toLocaleString()}종목
                </p>
                <ol className="mt-2 space-y-1 text-[13px]">
                  {i.top.map((t) => (<li key={t.name} className="flex justify-between gap-2"><span className="truncate">{t.name}</span><span className="tnum text-slate-600">{t.pct.toFixed(1)}%</span></li>))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs leading-5 text-slate-500">{d.disclaimer}</p>
      </div>

      <aside className="hidden w-[300px] shrink-0 2xl:block">
        <div className="sticky top-16 space-y-4">
          <AdSlot variant="side" />
          <div className="card p-4 text-sm">
            <h2 className="mb-2 font-semibold">지표 해설</h2>
            <ul className="space-y-1.5 text-[13px] text-slate-700">
              {["yield-curve:장단기 금리차", "vix:VIX 공포지수", "shiller-cape:실러 CAPE", "usd-krw:원달러 환율", "recession-probability:미국 침체확률", "gold:금 시세"].map((s) => {
                const [slug, label] = s.split(":");
                return <li key={slug}><Link href={`/indicators/${slug}/`} className="hover:text-brand-700 hover:underline">{label}</Link></li>;
              })}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
