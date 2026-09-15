import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "거시경제 지표 해설 - 장단기금리차·VIX·CAPE·환율·침체확률",
  description: "주식 투자자가 매일 확인하는 거시경제 지표 15종의 현재 값, 장기 추이, 해석 방법을 정리했습니다.",
  alternates: { canonical: "/indicators/" },
};

export default async function Indicators() {
  const list = await api.indicators();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">거시경제 지표 해설</h1>
      <p className="mt-1 text-sm text-slate-500">각 지표의 현재 값과 장기 추이, 읽는 법을 매일 갱신합니다.</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((i) => (
          <li key={i.slug}>
            <Link href={`/indicators/${i.slug}/`} className="card block p-4 transition hover:-translate-y-0.5 hover:border-brand-500">
              <div className="font-semibold">{i.short}</div>
              <div className="mt-1 text-xs text-slate-500">{i.name}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
