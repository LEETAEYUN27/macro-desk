import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import MarketTable from "@/components/MarketTable";
import { api } from "@/lib/api";
import { asofKST } from "@/lib/format";
import { MARKET_SLUGS } from "@/lib/site";

export const revalidate = 3600;
export const dynamicParams = false;
export function generateStaticParams() {
  return MARKET_SLUGS.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const m = await api.market(slug);
    const title = `오늘의 ${m.label} 시세 - 기간별 등락률`;
    return { title, description: `${m.label} ${m.items.length}종의 현재가와 1일·1주·1개월·3개월·연초 대비 등락률을 매일 갱신합니다.`, alternates: { canonical: `/markets/${slug}/` }, openGraph: { images: ["/og.png"], title } };
  } catch { return {}; }
}

export default async function MarketPage({ params }: Props) {
  const { slug } = await params;
  if (!MARKET_SLUGS.includes(slug)) notFound();
  const m = await api.market(slug);
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{m.label}</h1>
        <p className="mt-1 text-sm text-slate-500">기준 {asofKST(m.asof)} · 종가 기준 · 상승 빨강 / 하락 파랑</p>
      </div>
      <AdSlot variant="top" />
      <section className="card"><MarketTable items={m.items} full /></section>
    </div>
  );
}
