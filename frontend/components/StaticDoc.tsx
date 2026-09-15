export default function StaticDoc({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="card mx-auto max-w-3xl p-6 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {updated && <p className="mt-1 text-xs text-slate-500">시행일 {updated}</p>}
      <div className="prose-ko mt-5 space-y-4 text-[15px] [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_li]:leading-7 [&_li]:text-slate-700">{children}</div>
    </article>
  );
}
