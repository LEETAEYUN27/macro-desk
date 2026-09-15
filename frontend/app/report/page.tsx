import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import JsonLd from "@/components/JsonLd";
import { api } from "@/lib/api";
import { asofKST } from "@/lib/format";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const r = await api.report();
    const title = `${r.date} 거시경제 브리핑 - ${r.headline}`;
    return { title, description: r.paragraphs[0].slice(0, 155), alternates: { canonical: "/report/" }, openGraph: { images: ["/og.png"], title, type: "article" } };
  } catch { return {}; }
}

export default async function ReportPage() {
  const r = await api.report();
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "NewsArticle", headline: r.headline, datePublished: r.date, dateModified: r.date, inLanguage: "ko-KR", author: { "@type": "Organization", name: SITE.name } }} />
      <header>
        <p className="text-sm font-medium text-brand-700">오늘의 거시경제 브리핑</p>
        <h1 className="mt-1 text-2xl font-bold leading-snug tracking-tight">{r.headline}</h1>
        <p className="mt-2 text-sm text-slate-500">기준 {asofKST(r.asof)}</p>
      </header>
      <div className="card prose-ko p-6 text-[15.5px]">
        {r.paragraphs.slice(0, 2).map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <AdSlot variant="inArticle" />
      <div className="card prose-ko p-6 text-[15.5px]">
        {r.paragraphs.slice(2).map((p, i) => <p key={i}>{p}</p>)}
        <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm text-slate-700">
          {r.bullets.map((b, i) => <li key={i}>✓ {b}</li>)}
        </ul>
      </div>
      <p className="text-xs text-slate-500">{r.method}</p>
      <Link href="/" className="inline-block text-sm font-medium text-brand-700 hover:underline">대시보드로 이동</Link>
    </article>
  );
}
