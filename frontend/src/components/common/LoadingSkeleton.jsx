export function MedicineCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-line p-4 flex flex-col justify-between animate-subtle-pulse">
      <div>
        <div className="w-full h-44 bg-surface-alt rounded-lg mb-4" />
        <div className="h-3.5 bg-line rounded w-1/3 mb-2" />
        <div className="h-5 bg-line rounded w-3/4 mb-2" />
        <div className="h-3.5 bg-surface-alt rounded w-1/2 mb-4" />
        <div className="h-4 bg-surface-alt rounded w-2/3 mb-2" />
      </div>
      <div className="pt-4 border-t border-line flex items-center justify-between mt-4">
        <div className="h-6 bg-line rounded w-1/4" />
        <div className="h-9 bg-line rounded w-1/3" />
      </div>
    </div>
  );
}

export function MedicineDetailsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-subtle-pulse text-left">
      <div className="h-4 bg-line rounded w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 h-96 bg-surface-alt rounded-2xl border border-line" />
        <div className="md:col-span-7 space-y-4">
          <div className="h-4 bg-line rounded w-24" />
          <div className="h-8 bg-line rounded w-3/4" />
          <div className="h-4 bg-surface-alt rounded w-1/2" />
          <div className="h-10 bg-line rounded w-1/3 my-4" />
          <div className="h-24 bg-surface-alt rounded-xl border border-line" />
          <div className="h-12 bg-line rounded-lg w-full mt-6" />
        </div>
      </div>
    </div>
  );
}
