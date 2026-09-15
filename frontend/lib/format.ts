export function num(v: number | null | undefined, digits = 2) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  const abs = Math.abs(v);
  const d = abs >= 1000 ? Math.min(digits, 1) : digits;
  return v.toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function pct(v: number | null | undefined, digits = 2) {
  if (v === null || v === undefined) return "-";
  return `${v > 0 ? "+" : ""}${v.toFixed(digits)}%`;
}

// 국내 관행 : 상승 = 빨강, 하락 = 파랑
export function tone(v: number | null | undefined) {
  if (v === null || v === undefined || Math.abs(v) < 0.005) return "text-slate-500";
  return v > 0 ? "text-rose-600" : "text-blue-600";
}

export function asofKST(utc: string) {
  // "2026-09-15 00:11 UTC" → "2026. 9. 15. 09:11 (KST)"
  const m = utc.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
  if (!m) return utc;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
  const k = new Date(d.getTime() + 9 * 3600_000);
  const hh = String(k.getUTCHours()).padStart(2, "0");
  const mm = String(k.getUTCMinutes()).padStart(2, "0");
  return `${k.getUTCFullYear()}. ${k.getUTCMonth() + 1}. ${k.getUTCDate()}. ${hh}:${mm} (KST)`;
}

export function scoreColor(s: number) {
  if (s >= 65) return "#2563eb";
  if (s >= 50) return "#0891b2";
  if (s >= 35) return "#d97706";
  return "#dc2626";
}
