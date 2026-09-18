export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  name: process.env.NEXT_PUBLIC_SITE_NAME || "글로벌 경제 관제실",
  tagline: "금리·환율·물가·변동성·경기침체 확률을 한 화면에서 매일 확인하는 거시경제 대시보드",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  adsense: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
  slots: {
    top: process.env.NEXT_PUBLIC_AD_SLOT_TOP || "",
    side: process.env.NEXT_PUBLIC_AD_SLOT_SIDE || "",
    inArticle: process.env.NEXT_PUBLIC_AD_SLOT_INARTICLE || "",
  },
  adPlaceholder: process.env.NEXT_PUBLIC_SHOW_AD_PLACEHOLDER === "1",
};

export const NAV = [
  { href: "/", label: "대시보드" },
  { href: "/report/", label: "오늘의 브리핑" },
  { href: "/calendar/", label: "경제 일정" },
  { href: "/indicators/", label: "지표 해설" },
  { href: "/markets/indices/", label: "주요 지수" },
  { href: "/markets/commodities/", label: "원자재" },
  { href: "/markets/fx-rates/", label: "환율·금리" },
  { href: "/markets/us-sectors/", label: "미국 섹터" },
  { href: "/markets/kr-sectors/", label: "한국 섹터" },
  { href: "/markets/real-estate/", label: "부동산·리츠" },
];

export const MARKET_SLUGS = ["indices", "commodities", "fx-rates", "us-sectors", "kr-sectors", "real-estate"];
