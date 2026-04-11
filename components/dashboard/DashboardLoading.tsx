function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[1.5rem] bg-white/6 ${className ?? ""}`} />;
}

export function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-6"
          >
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-4 h-10 w-32" />
            <SkeletonBlock className="mt-3 h-4 w-40" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-6">
          <SkeletonBlock className="h-4 w-48" />
          <SkeletonBlock className="mt-4 h-[320px] w-full" />
        </div>
        <div className="rounded-[1.8rem] border border-white/10 bg-[#111111] p-6">
          <SkeletonBlock className="h-4 w-40" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
