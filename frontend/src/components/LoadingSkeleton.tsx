export const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}></div>
);

export const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
        <LoadingSkeleton className="aspect-square w-full" />
        <LoadingSkeleton className="h-4 w-1/4" />
        <LoadingSkeleton className="h-6 w-full" />
        <div className="flex justify-between items-center pt-2">
          <LoadingSkeleton className="h-8 w-1/3" />
          <LoadingSkeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-start">
          <LoadingSkeleton className="h-12 w-12 rounded-xl" />
          <LoadingSkeleton className="h-4 w-16 rounded-full" />
        </div>
        <LoadingSkeleton className="h-4 w-1/2" />
        <LoadingSkeleton className="h-8 w-2/3" />
      </div>
    ))}
  </div>
);
