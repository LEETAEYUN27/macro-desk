"use client";
import { useEffect, useRef } from "react";
import { SITE } from "@/lib/site";

type Variant = "top" | "side" | "inArticle";
const SIZE: Record<Variant, string> = {
  top: "min-h-[90px]",
  side: "min-h-[600px]",
  inArticle: "min-h-[250px]",
};

declare global { interface Window { adsbygoogle?: unknown[] } }

/**
 * 광고 구좌. 애드센스 승인 전(클라이언트 ID 없음)에는 아무것도 렌더하지 않는다.
 * 빈 광고 상자는 심사에서 '콘텐츠 부족'으로 보일 수 있기 때문.
 * 레이아웃 이동(CLS)을 막기 위해 구좌 높이를 미리 확보한다.
 */
export default function AdSlot({ variant, className = "" }: { variant: Variant; className?: string }) {
  const ref = useRef<HTMLModElement>(null);
  const slot = SITE.slots[variant];

  useEffect(() => {
    if (!SITE.adsense || !slot || !ref.current) return;
    if (ref.current.getAttribute("data-adsbygoogle-status")) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* 광고 차단기 등 */ }
  }, [slot]);

  if (!SITE.adsense || !slot) {
    if (!SITE.adPlaceholder) return null;
    return (
      <div className={`flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400 ${SIZE[variant]} ${className}`}>
        광고 구좌 ({variant})
      </div>
    );
  }
  return (
    <div className={`${SIZE[variant]} ${className}`} aria-label="광고">
      <div className="mb-1 text-[10px] text-slate-400">광고</div>
      <ins
        ref={ref}
        className="adsbygoogle block"
        data-ad-client={SITE.adsense}
        data-ad-slot={slot}
        data-ad-format={variant === "side" ? "vertical" : variant === "inArticle" ? "fluid" : "horizontal"}
        {...(variant === "inArticle" ? { "data-ad-layout": "in-article" } : { "data-full-width-responsive": "true" })}
      />
    </div>
  );
}
