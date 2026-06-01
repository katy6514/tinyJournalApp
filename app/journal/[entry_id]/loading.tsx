import { BreadcrumbSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <main>
      <BreadcrumbSkeleton />

      {/* Prev / Next navigation */}
      <div className="flex justify-between py-2 text-sm w-[85%] mx-auto">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-4 w-40" />
      </div>

      {/* Metadata + minimap section */}
      <div className="flex gap-6 items-start py-6 w-[85%] mx-auto">
        <div className="w-1/2 flex flex-col items-end space-y-1">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-7 w-48" />
          <div className="skeleton h-6 w-28" />
          <div className="space-y-1.5 pt-3 flex flex-col items-end">
            <div className="flex gap-4">
              <div className="skeleton h-4 w-12" />
              <div className="skeleton h-4 w-32" />
            </div>
            <div className="flex gap-4">
              <div className="skeleton h-4 w-12" />
              <div className="skeleton h-4 w-32" />
            </div>
            <div className="flex gap-4">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-16" />
            </div>
          </div>
        </div>
        <div className="w-1/2">
          <div className="skeleton h-64 w-full rounded-lg" />
        </div>
      </div>

      {/* Constrained journal content */}
      <div className="max-w-3xl mx-auto p-6">
        <div className="space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-10/12" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-9/12" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-10/12" />
          <div className="skeleton h-4 w-7/12" />
        </div>
        <div className="flex gap-1 mt-8">
          <div className="skeleton h-28 flex-[2]" />
          <div className="skeleton h-28 flex-[3]" />
          <div className="skeleton h-28 flex-[2]" />
          <div className="skeleton h-28 flex-[1]" />
        </div>
        <div className="mt-6 flex justify-end">
          <div className="skeleton h-10 w-24" />
        </div>
      </div>
    </main>
  );
}
