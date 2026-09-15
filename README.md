# 글로벌 경제 관제실 - 웹 서비스판 (macro-web)

기존 `macro-console`(GitHub Actions 일일 수집기)을 **검색 노출 · 애드센스 수익화가 가능한 풀스택 웹 서비스**로 확장한 프로젝트입니다.

- Backend : Python FastAPI (원자료 캐싱·가공, FRED 실시간 조회, Open DART 공시, 자동 해설)
- Frontend : Next.js 16 (App Router) + Tailwind CSS 4, SSR/SSG, 순수 SVG 차트
- 배포 권장 : Cloudflare Pages(정적, 무료) + Render(API) · 매일 07:40 KST 자동 재배포

상세 절차는 `DEPLOY_GUIDE.md` 를 참고하시기 바랍니다.

## 로컬 실행

```bash
# 1) 백엔드
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000     # http://localhost:8000/docs

# 2) 프런트엔드 (새 터미널)
cd frontend
npm install
cp .env.example .env.local
npm run dev                                   # http://localhost:3000
```

## 시험

```bash
cd backend && python -m pytest -q      # 4 passed
cd frontend && npm run build           # 34개 페이지 생성
```
