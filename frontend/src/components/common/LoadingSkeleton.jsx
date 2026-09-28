export function MedicineCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#e4e2dd] p-4 flex flex-col justify-between animate-subtle-pulse">
      <div>
        <div className="w-full h-44 bg-[#fafaf7] rounded-lg mb-4" />
        <div className="h-3.5 bg-[#e4e2dd] rounded w-1/3 mb-2" />
        <div className="h-5 bg-[#e4e2dd] rounded w-3/4 mb-2" />
        <div className="h-3.5 bg-[#fafaf7] rounded w-1/2 mb-4" />
        <div className="h-4 bg-[#fafaf7] rounded w-2/3 mb-2" />
      </div>
      <div className="pt-4 border-t border-[#e4e2dd] flex items-center justify-between mt-4">
        <div className="h-6 bg-[#e4e2dd] rounded w-1/4" />
        <div className="h-9 bg-[#e4e2dd] rounded w-1/3" />
      </div>
    </div>
  );
}

export function MedicineDetailsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-subtle-pulse text-left">
      <div className="h-4 bg-[#e4e2dd] rounded w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 h-96 bg-[#fafaf7] rounded-2xl border border-[#e4e2dd]" />
        <div className="md:col-span-7 space-y-4">
          <div className="h-4 bg-[#e4e2dd] rounded w-24" />
          <div className="h-8 bg-[#e4e2dd] rounded w-3/4" />
          <div className="h-4 bg-[#fafaf7] rounded w-1/2" />
          <div className="h-10 bg-[#e4e2dd] rounded w-1/3 my-4" />
          <div className="h-24 bg-[#fafaf7] rounded-xl border border-[#e4e2dd]" />
          <div className="h-12 bg-[#e4e2dd] rounded-lg w-full mt-6" />
        </div>
      </div>
    </div>
  );
}
