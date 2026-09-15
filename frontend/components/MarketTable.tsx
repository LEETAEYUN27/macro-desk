import { num, pct, tone } from "@/lib/format";
import type { Item } from "@/lib/types";
import { Sparkline } from "./charts";

export default function MarketTable({ items, full = false }: { items: Item[]; full?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
            <th className="px-4 py-2 font-medium">종목</th>
            <th className="px-2 py-2 text-right font-medium">현재</th>
            <th className="px-2 py-2 text-right font-medium">1일</th>
            {full && <th className="px-2 py-2 text-right font-medium">1주</th>}
            <th className="px-2 py-2 text-right font-medium">1개월</th>
            {full && <th className="px-2 py-2 text-right font-medium">3개월</th>}
            <th className="px-2 py-2 text-right font-medium">연초 대비</th>
            <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">추이</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.ticker} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
              <td className="px-4 py-2">
                <div className="font-medium text-slate-800">{it.name}</div>
                <div className="text-[11px] text-slate-400">{it.ticker} · {it.asof}</div>
              </td>
              <td className="tnum px-2 py-2 text-right font-medium">{num(it.last)}</td>
              <td className={`tnum px-2 py-2 text-right ${tone(it.chg.d1)}`}>{pct(it.chg.d1)}</td>
              {full && <td className={`tnum px-2 py-2 text-right ${tone(it.chg.w1)}`}>{pct(it.chg.w1)}</td>}
              <td className={`tnum px-2 py-2 text-right ${tone(it.chg.m1)}`}>{pct(it.chg.m1)}</td>
              {full && <td className={`tnum px-2 py-2 text-right ${tone(it.chg.m3)}`}>{pct(it.chg.m3)}</td>}
              <td className={`tnum px-2 py-2 text-right ${tone(it.ytd)}`}>{pct(it.ytd)}</td>
              <td className="hidden px-4 py-2 text-right sm:table-cell"><div className="flex justify-end"><Sparkline data={it.spark} /></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
