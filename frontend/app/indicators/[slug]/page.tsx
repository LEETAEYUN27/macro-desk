import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import { LineChart } from "@/components/charts";
import JsonLd from "@/components/JsonLd";
import { api } from "@/lib/api";
import { num, pct, tone } from "@/lib/format";
import { SITE } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  const list = await api.indicators();
  return list.map((i) => ({ slug: i.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const d = await api.indicator(slug);
    const v = d.value !== null ? `${num(d.value)}${d.unit}` : "";
    const title = `${d.short} 현재 ${v} - 추이와 해석`;
    const desc = `${d.name} 오늘 수치 ${v} (${d.asof} 기준). ${d.reading}`.slice(0, 155);
    return {
      title, description: desc, keywords: d.keywords,
      alternates: { canonical: `/indicators/${slug}/` },
      openGraph: { images: ["/og.png"], title, description: desc, url: `/indicators/${slug}/`, type: "article" },
      twitter: { title, description: desc },
    };
  } catch {
    return {};
  }
}

export default async function IndicatorPage({ params }: Props) {
  const { slug } = await params;
  let d;
  try { d = await api.indicator(slug); } catch { notFound(); }
  const hasDaily = d.daily.length > 20;

  return (
    <article className="mx-auto max-w-4xl space-y-5">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: `${d.name} 추이와 해석`,
        dateModified: d.asof, inLanguage: "ko-KR", author: { "@type": "Organization", name: SITE.name },
        publisher: { "@type": "Organization", name: SITE.name }, mainEntityOfPage: `${SITE.url}/indicators/${slug}/`,
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: `${SITE.url}/` },
          { "@type": "ListItem", position: 2, name: "지표 해설", item: `${SITE.url}/indicators/` },
          { "@type": "ListItem", position: 3, name: d.short, item: `${SITE.url}/indicators/${slug}/` },
        ],
      }} />
      <nav className="text-xs text-slate-500"><Link href="/">홈</Link> / <Link href="/indicators/">지표 해설</Link> / {d.short}</nav>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{d.name}</h1>
        <p className="mt-1 text-sm text-slate-500">출처 {d.source} · {d.asof} 기준</p>
      </header>

      <section className="card grid gap-4 p-5 md:grid-cols-[220px_1fr]">
        <div>
          <div className="text-xs text-slate-500">현재 값</div>
          <div className="tnum mt-1 text-4xl font-bold text-slate-900">{d.value !== null ? num(d.value) : "-"}<span className="ml-1 text-base font-medium text-slate-500">{d.unit}</span></div>
          {d.chg && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              {(["d1", "m1", "y1"] as const).map((k) => (
                <div key={k} className="rounded-md bg-slate-50 py-1.5">
                  <div className="text-slate-500">{{ d1: "1일", m1: "1개월", y1: "1년" }[k]}</div>
                  <div className={`tnum font-semibold ${tone(d.chg?.[k])}`}>{pct(d.chg?.[k])}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border-l-4 border-brand-600 bg-brand-50/60 px-4 py-3">
          <h2 className="text-sm font-semibold text-brand-700">현재 수치 해석</h2>
          <p className="mt-1 text-[15px] leading-7 text-slate-800">{d.reading}</p>
        </div>
      </section>

      <section className="card">
        <div className="card-h"><h2 className="card-t">{hasDaily ? "최근 1년 일별 추이" : "장기 추이"}</h2></div>
        <div className="p-3"><LineChart data={hasDaily ? d.daily : d.series} unit={d.unit === "%" || d.unit === "%p" ? d.unit : ""} zeroLine={slug === "yield-curve" || slug === "market-concentration" || slug === "nfci"} /></div>
      </section>

      {hasDaily && d.series.length > 24 && (
        <section className="card">
          <div className="card-h"><h2 className="card-t">장기 월별 추이</h2></div>
          <div className="p-3"><LineChart data={d.series} height={200} /></div>
        </section>
      )}

      <AdSlot variant="inArticle" />

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{d.short}이란</h2>
        <div className="prose-ko mt-2 text-[15px]">{d.explainer.map((p, i) => <p key={i}>{p}</p>)}</div>
      </section>

      {d.related.length > 0 && (
        <section className="card p-5">
          <h2 className="text-sm font-semibold">함께 보면 좋은 지표</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {d.related.map((r) => <Link key={r.slug} href={`/indicators/${r.slug}/`} className="rounded-full border border-slate-200 px-3 py-1 text-sm hover:border-brand-500 hover:text-brand-700">{r.short}</Link>)}
          </div>
        </section>
      )}
      <p className="text-xs text-slate-500">본 페이지는 공개 데이터를 정리한 정보이며 투자 권유가 아닙니다.</p>
    </article>
  );
}
