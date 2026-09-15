import type { Dashboard, IndicatorDetail, MarketGroup, Report } from "./types";

const BASE = (process.env.API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
// 백엔드 캐시(30분)보다 약간 길게 : 페이지는 1시간마다 백그라운드 재생성(ISR)
export const REVALIDATE = 3600;

async function get<T>(path: string): Promise<T> {
  let last: unknown;
  // Render 무료 인스턴스 기동 지연(약 1분)을 고려해 재시도
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`${BASE}${path}`, {
        next: { revalidate: REVALIDATE },
        signal: AbortSignal.timeout(90_000),
      });
      if (!r.ok) throw new Error(`${path} ${r.status}`);
      return (await r.json()) as T;
    } catch (e) {
      last = e;
      await new Promise((res) => setTimeout(res, 3000 * (i + 1)));
    }
  }
  throw last;
}

export const api = {
  dashboard: () => get<Dashboard>("/api/dashboard"),
  indicators: () => get<{ slug: string; name: string; short: string; unit: string }[]>("/api/indicators"),
  indicator: (slug: string) => get<IndicatorDetail>(`/api/indicators/${slug}`),
  market: (slug: string) => get<MarketGroup>(`/api/markets/${slug}`),
  report: () => get<Report>("/api/report/daily"),
};
