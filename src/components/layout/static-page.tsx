export function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-semibold">{title}</h1>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
