"use client";
import { useEffect, useState } from "react";
import type { CalEvent } from "@/lib/types";

const KIND_LABEL: Record<string, string> = {
  fomc: "미국 금리", cpi: "미국 물가", jobs: "미국 고용", pce: "미국 물가",
  gdp: "미국 성장", bok: "한국 금리", other: "기타",
};
const KIND_COLOR: Record<string, string> = {
  fomc: "bg-rose-50 text-rose-700 border-rose-200",
  bok: "bg-indigo-50 text-indigo-700 border-indigo-200",
  cpi: "bg-amber-50 text-amber-700 border-amber-200",
  pce: "bg-amber-50 text-amber-700 border-amber-200",
  jobs: "bg-emerald-50 text-emerald-700 border-emerald-200",
  gdp: "bg-slate-100 text-slate-600 border-slate-200",
};
// 다음 이벤트가 가장 진하고, 뒤로 갈수록 흐려진다
const FADE = [1, 0.82, 0.64, 0.5, 0.4, 0.32];

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function remain(ms: number) {
  if (ms <= 0) return "발표 임박";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d > 0) return `D-${d}  ${h}시간 ${m}분`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")} 남음`;
}

function Odds({ odds }: { odds: { key: string; label: string; prob: number }[] }) {
  return (
    <div>
      <div className="flex h-7 overflow-hidden rounded-md">
        {odds.map((o) => (
          <div key={o.key} style={{ width: `${Math.max(o.prob, 8)}%` }}
            className={`flex items-center justify-center text-[11px] font-semibold text-white ${o.key === "hike" ? "bg-rose-500" : o.key === "cut" ? "bg-blue-500" : "bg-slate-400"}`}>
            {o.prob}%
          </div>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-600">
        {odds.map((o) => <span key={o.key}>{o.label} {o.prob}%</span>)}
      </div>
    </div>
  );
}

export default function EventTimeline({ upcoming, past, note }: { upcoming: CalEvent[]; past: CalEvent[]; note: string }) {
  const now = useNow();
  // 서버 렌더링 시점에는 서버 기준으로, 브라우저에서는 실시간으로 지난 이벤트를 걸러낸다
  const live = now ?? Date.parse(upcoming[0]?.at_kst ?? "") - 1;
  const future = upcoming.filter((e) => Date.parse(e.at_kst) > live).slice(0, 6);
  const justPassed = upcoming.filter((e) => Date.parse(e.at_kst) <= live);
  const done = [...justPassed.reverse(), ...past].slice(0, 4);
  const head = future[0];

  return (
    <section className="card">
      <div className="card-h">
        <h2 className="card-t">경제 이벤트 타임라인</h2>
        <span className="text-xs text-slate-500">한국시간 기준 · 지난 일정은 자동으로 넘어갑니다</span>
      </div>

      {head && (
        <div className="border-b border-slate-100 bg-gradient-to-r from-brand-50 to-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${KIND_COLOR[head.kind] ?? KIND_COLOR.gdp}`}>
              {KIND_LABEL[head.kind] ?? "기타"}
            </span>
            <span className="text-xs text-slate-500">{head.date} {head.time_kst}</span>
            <span className="tnum ml-auto rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white" suppressHydrationWarning>
              {now === null ? `D-${Math.max(head.days_left, 0)}` : remain(Date.parse(head.at_kst) - now)}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-slate-900">{head.name}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{head.why}</p>
          {head.odds ? (
            <div className="mt-3 max-w-md">
              <div className="mb-1 text-xs font-medium text-slate-500">선물 시장이 반영 중인 결과 확률</div>
              <Odds odds={head.odds} />
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">이 지표는 사전 확률이 공개되지 않아, 발표 후 실제 수치를 이 자리에 표시합니다.</p>
          )}
        </div>
      )}

      <ol className="divide-y divide-slate-50">
        {future.slice(1).map((e, i) => (
          <li key={e.date + e.name} style={{ opacity: FADE[i + 1] ?? 0.3 }}
            className="grid gap-1 px-5 py-3 transition-opacity sm:grid-cols-[92px_1fr_150px] sm:items-center">
            <span className="tnum text-xs font-semibold text-brand-700" suppressHydrationWarning>
              D-{now === null ? Math.max(e.days_left, 0) : Math.max(Math.ceil((Date.parse(e.at_kst) - now) / 86400000), 0)}
            </span>
            <span>
              <span className="text-sm font-medium text-slate-800">{e.name}</span>
              <span className="block text-[11px] text-slate-500">{e.date} {e.time_kst} · {KIND_LABEL[e.kind] ?? "기타"}</span>
            </span>
            {e.odds ? <Odds odds={e.odds} /> : <span className="text-[11px] text-slate-400">확률 미제공</span>}
          </li>
        ))}
      </ol>

      {done.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <div className="mb-2 text-xs font-semibold text-slate-500">지난 이벤트 결과</div>
          <ul className="space-y-1.5">
            {done.map((e) => (
              <li key={e.date + e.name} className="flex flex-wrap gap-x-3 text-[13px] text-slate-600">
                <span className="tnum text-slate-400">{e.date}</span>
                <span className="font-medium text-slate-700">{e.name}</span>
                <span className="text-slate-600">{e.result_text ?? "결과 집계 중"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="px-5 py-2.5 text-[11px] leading-5 text-slate-500">{note}</p>
    </section>
  );
}
