'use client';

function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

/** Skeleton for a single CityCard */
export function CityCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-2">
      <SkeletonBox className="h-4 w-3/4" />
      <SkeletonBox className="h-3 w-1/2" />
      <SkeletonBox className="h-3 w-2/3" />
    </div>
  );
}

/** Skeleton for a city list of N cards */
export function CityListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CityCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton for a data table row */
export function CityTableRowSkeleton() {
  return (
    <tr className="border-b border-gray-100">
      {[40, 32, 24, 20, 16].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBox className={`h-4 w-${w}`} />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton for a full city table */
export function CityTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <CityTableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Skeleton for the map placeholder */
export function CityMapSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-200 ${className}`}
      style={{ minHeight: '320px' }}
      aria-label="Loading map"
    />
  );
}
