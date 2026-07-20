"use client";

export default function SkeletonResults() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-2/3 animate-skeleton rounded bg-white/10" />
      <div className="flex gap-2">
        <div className="h-8 w-24 animate-skeleton rounded-lg bg-white/10" />
        <div className="h-8 w-24 animate-skeleton rounded-lg bg-white/10" />
        <div className="h-8 w-24 animate-skeleton rounded-lg bg-white/10" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="animate-skeleton space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 rounded bg-white/10" />
                <div className="h-2.5 w-1/3 rounded bg-white/10" />
              </div>
            </div>
            <div className="h-2.5 w-full rounded bg-white/10" />
            <div className="h-2.5 w-5/6 rounded bg-white/10" />
            <div className="h-2.5 w-2/3 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
