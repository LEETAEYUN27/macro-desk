export type Chg = Partial<Record<"d1" | "w1" | "m1" | "m3" | "m6" | "y1", number | null>>;
export interface Item { name: string; ticker: string; last: number; asof: string; chg: Chg; ytd: number | null; spark: number[] }
export interface Group { key: string; slug: string; label: string; items: Item[] }
export interface Component { name: string; score: number; detail: string }
export interface Insight { headline: string; paragraphs: string[]; bullets: string[]; method: string }
export interface Dashboard {
  asof: string;
  fallback: boolean;
  stability: { score: number; label: string; components: Component[]; metrics: { name: string; value: string }[]; method: string };
  insight: Insight;
  rate_odds: { meeting: string; asof: string; outcomes: { key: string; label: string; prob: number }[]; method: string; path: { label: string; v: string }[] } | null;
  concentration: { last: number; asof: string; pctile: number; chg_3m: number | null; level: string; trend: string; alert: boolean; series: [string, number][]; method: string } | null;
  movers: { up: { name: string; chg: number; group: string }[]; down: { name: string; chg: number; group: string }[] };
  groups: Group[];
  events: { date: string; name: string; why: string }[];
  institutions: { key: string; label: string; report_date: string; total_value_usd: number; n_positions: number; top: { name: string; value: number; pct: number }[] }[];
  usdkrw: number | null;
  disclaimer: string;
}
export interface IndicatorDetail {
  slug: string; name: string; short: string; keywords: string[]; unit: string; source: string;
  value: number | null; asof: string; reading: string; explainer: string[];
  series: [string, number][]; daily: [string, number][]; chg: Chg | null;
  related: { slug: string; short: string }[];
}
export interface MarketGroup { slug: string; label: string; asof: string; items: Item[] }
export interface Report extends Insight { asof: string; date: string; stability_score: number; stability_label: string }
