export const ProductCardSkeleton = () => (
  <div className="card-surface overflow-hidden animate-pulse">
    <div className="aspect-[4/5] bg-stone-200" />
    <div className="p-5 space-y-3">
      <div className="h-3 w-1/3 bg-stone-200 rounded" />
      <div className="h-4 w-3/4 bg-stone-200 rounded" />
      <div className="h-3 w-1/2 bg-stone-200 rounded" />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const OrderCardSkeleton = () => (
  <div className="card-surface p-6 flex flex-wrap items-center gap-6 animate-pulse">
    <div className="flex items-center -space-x-3 shrink-0">
      <div className="w-16 h-16 rounded-xl bg-stone-200 border-2 border-white" />
      <div className="w-16 h-16 rounded-xl bg-stone-200 border-2 border-white" />
    </div>
    <div className="flex-1 min-w-[180px] space-y-2">
      <div className="h-4 w-2/3 bg-stone-200 rounded" />
      <div className="h-3 w-1/2 bg-stone-200 rounded" />
    </div>
    <div className="flex items-center gap-5 ml-auto">
      <div className="h-6 w-20 bg-stone-200 rounded-full" />
      <div className="h-5 w-16 bg-stone-200 rounded" />
    </div>
  </div>
);
