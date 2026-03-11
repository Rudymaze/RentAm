function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function ProfileSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
      {/* Avatar + name row */}
      <div className="flex items-center gap-4">
        <SkeletonBox className="h-16 w-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-5 w-40" />
          <SkeletonBox className="h-4 w-20" />
        </div>
      </div>

      {/* Contact fields */}
      <div className="space-y-2">
        <SkeletonBox className="h-4 w-56" />
        <SkeletonBox className="h-4 w-44" />
      </div>
    </div>
  );
}
