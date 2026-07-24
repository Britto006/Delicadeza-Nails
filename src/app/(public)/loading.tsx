export default function Loading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto h-9 w-64 animate-pulse rounded-md bg-muted" />
        <div className="mx-auto mt-2 h-4 w-80 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="rounded-2xl bg-card p-6 shadow-medium">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
          <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
