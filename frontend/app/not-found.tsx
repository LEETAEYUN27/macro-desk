import Link from "next/link";
export default function NotFound() {
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <h1 className="text-xl font-bold">페이지를 찾을 수 없습니다</h1>
      <Link href="/" className="mt-4 inline-block text-brand-700 hover:underline">대시보드로 이동</Link>
    </div>
  );
}
