import Link from "next/link";
import { NAV, SITE } from "@/lib/site";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex h-12 items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-900">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
              <path d="M3 17a9 9 0 0 1 18 0" fill="none" stroke="#2563eb" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M12 17l4.5-5" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            {SITE.name}
          </Link>
          <span className="hidden text-xs text-slate-500 md:inline">매일 07시 갱신 · 공개 데이터 기반</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-2 py-1.5 lg:hidden" aria-label="주 메뉴">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 rounded-md px-2.5 py-1 text-[13px] text-slate-600 hover:bg-slate-100">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-52 shrink-0 border-r border-slate-200 bg-white px-3 py-4 lg:block">
          <nav aria-label="주 메뉴" className="flex flex-col gap-0.5">
            {NAV.map((n, i) => (
              <div key={n.href}>
                {i === 3 && <div className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">시장</div>}
                <Link href={n.href} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700">
                  {n.label}
                </Link>
              </div>
            ))}
          </nav>
          <div className="mt-6 border-t border-slate-100 px-3 pt-4 text-xs leading-6 text-slate-500">
            <Link href="/about/" className="block hover:text-slate-800">서비스 소개</Link>
            <Link href="/privacy/" className="block hover:text-slate-800">개인정보처리방침</Link>
            <Link href="/terms/" className="block hover:text-slate-800">이용약관</Link>
            <Link href="/contact/" className="block hover:text-slate-800">문의</Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-5 md:px-6">{children}</main>
      </div>
      <footer className="border-t border-slate-200 bg-white px-6 py-6 text-xs leading-6 text-slate-500">
        <div className="mx-auto max-w-[1440px]">
          <p>본 사이트는 공개 데이터를 정리해 보여주는 정보 서비스이며 투자 자문이나 매매 권유가 아닙니다. 모든 투자 판단과 책임은 이용자 본인에게 있습니다.</p>
          <p className="mt-1">데이터 출처 : FRED(세인트루이스 연준), 뉴욕 연준, 시카고 연준, SEC EDGAR, Zillow, multpl.com, Yahoo Finance</p>
          <p className="mt-2 flex flex-wrap gap-x-4 lg:hidden">
            <Link href="/about/">서비스 소개</Link><Link href="/privacy/">개인정보처리방침</Link><Link href="/terms/">이용약관</Link><Link href="/contact/">문의</Link>
          </p>
          <p className="mt-2">© {new Date().getFullYear()} {SITE.name}</p>
        </div>
      </footer>
    </div>
  );
}
