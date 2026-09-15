import { scoreColor } from "@/lib/format";

/** 반원 게이지 (0~100, 100 = 안정) */
export function Gauge({ score, label }: { score: number; label: string }) {
  const r = 80, cx = 100, cy = 96;
  const a = Math.PI * (1 - Math.max(0, Math.min(100, score)) / 100);
  const x = cx + r * Math.cos(a), y = cy - r * Math.sin(a);
  const color = scoreColor(score);
  return (
    <svg viewBox="0 0 200 116" className="w-full max-w-[260px]" role="img" aria-label={`경제 안정성 ${score}점 ${label}`}>
      <defs>
        <linearGradient id="g-track" x1="0" x2="1">
          <stop offset="0" stopColor="#fecaca" /><stop offset="0.45" stopColor="#fde68a" /><stop offset="1" stopColor="#bfdbfe" />
        </linearGradient>
      </defs>
      <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`} fill="none" stroke="url(#g-track)" strokeWidth="14" strokeLinecap="round" />
      <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${x},${y}`} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
      <circle cx={x} cy={y} r="7" fill="#fff" stroke={color} strokeWidth="3" />
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize="34" fontWeight="700" fill="#0f172a" className="tnum">{score.toFixed(1)}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="13" fontWeight="600" fill={color}>{label}</text>
      <text x={cx - r} y={cy + 16} textAnchor="middle" fontSize="9" fill="#94a3b8">0</text>
      <text x={cx + r} y={cy + 16} textAnchor="middle" fontSize="9" fill="#94a3b8">100</text>
    </svg>
  );
}

export function Sparkline({ data, w = 96, h = 28 }: { data: number[]; w?: number; h?: number }) {
  if (!data || data.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - ((v - min) / span) * (h - 4)]);
  const up = data[data.length - 1] >= data[0];
  const stroke = up ? "#e11d48" : "#2563eb";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/** 추이 차트 (SSR 순수 SVG). 0 기준선·최고/최저·최근값 표시 */
export function LineChart({ data, unit = "", height = 240, zeroLine = false, w = 720 }: { data: [string, number][]; unit?: string; height?: number; zeroLine?: boolean; w?: number }) {
  if (!data || data.length < 2) return <p className="py-10 text-center text-sm text-slate-400">표시할 추이 데이터가 없습니다.</p>;
  const W = w, H = height, pl = 48, pr = 16, pt = 16, pb = 28;
  const vals = data.map((d) => d[1]);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (zeroLine) { min = Math.min(min, 0); max = Math.max(max, 0); }
  const pad = (max - min) * 0.08 || 1; min -= pad; max += pad;
  const X = (i: number) => pl + (i / (data.length - 1)) * (W - pl - pr);
  const Y = (v: number) => pt + (1 - (v - min) / (max - min)) * (H - pt - pb);
  const line = data.map((d, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(d[1]).toFixed(1)}`).join("");
  const area = `${line}L${X(data.length - 1)},${H - pb}L${pl},${H - pb}Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + (max - min) * t);
  const xt = [0, Math.floor(data.length / 3), Math.floor((2 * data.length) / 3), data.length - 1];
  const lastV = vals[vals.length - 1];
  const fmt = (v: number) => Math.abs(v) >= 1000 ? v.toLocaleString("ko-KR", { maximumFractionDigits: 0 }) : v.toFixed(Math.abs(v) >= 100 ? 0 : 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="추이 차트">
      <defs>
        <linearGradient id="lc-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" stopOpacity="0.22" /><stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={pl} x2={W - pr} y1={Y(t)} y2={Y(t)} stroke="#eef2f7" />
          <text x={pl - 6} y={Y(t) + 3} textAnchor="end" fontSize="10" fill="#94a3b8" className="tnum">{fmt(t)}</text>
        </g>
      ))}
      {zeroLine && min < 0 && max > 0 && <line x1={pl} x2={W - pr} y1={Y(0)} y2={Y(0)} stroke="#64748b" strokeDasharray="4 3" />}
      <path d={area} fill="url(#lc-fill)" />
      <path d={line} fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={X(data.length - 1)} cy={Y(lastV)} r="3.5" fill="#2563eb" />
      <text x={X(data.length - 1) - 6} y={Y(lastV) - 8} textAnchor="end" fontSize="11" fontWeight="600" fill="#1d4ed8" stroke="#fff" strokeWidth="3" paintOrder="stroke" className="tnum">{fmt(lastV)}{unit}</text>
      {xt.map((i) => (
        <text key={i} x={X(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fontSize="10" fill="#94a3b8">{data[i][0]}</text>
      ))}
    </svg>
  );
}

export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full" style={{ width: `${Math.max(2, score)}%`, background: `linear-gradient(90deg, ${scoreColor(score)}99, ${scoreColor(score)})` }} />
    </div>
  );
}
