import { BreadcrumbSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <main>
      <BreadcrumbSkeleton />

      {/* Prev / Next navigation + action buttons */}
      <div className="flex justify-between items-center py-2 mb-2 w-[85%] mx-auto">
        <div className="skeleton h-8 w-36 rounded-lg" />
        <div className="flex gap-2">
          <div className="skeleton h-10 w-32 rounded-lg" />
          <div className="skeleton h-10 w-24 rounded-lg" />
        </div>
        <div className="skeleton h-8 w-36 rounded-lg" />
      </div>

      {/* Metadata + minimap hero card — bg-gray-300 stands in for the photo background */}
      <div className="relative flex gap-6 items-stretch p-6 w-[85%] mx-auto bg-gray-300 dark:bg-gray-600 rounded-lg shadow-sm overflow-hidden">
        {/* Left: headings at top, table pinned to bottom */}
        <div className="w-1/2 flex flex-col items-end">
          <div className="space-y-2">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-7 w-48" />
            <div className="skeleton h-6 w-28" />
          </div>
          <div className="mt-auto space-y-1.5 pt-3 self-start">
            <div className="flex gap-4">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-36" />
            </div>
            <div className="flex gap-4">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-36" />
            </div>
            <div className="flex gap-4">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-20" />
            </div>
          </div>
        </div>

        {/* Right: minimap */}
        <div className="w-1/2">
          <div className="skeleton h-64 w-full rounded-lg" />
        </div>
      </div>

      <hr className="w-[85%] mx-auto mt-8 border-gray-200 dark:border-gray-600" />

      {/* Constrained journal content */}
      <div className="max-w-3xl mx-auto p-6">
        <div className="space-y-3 mt-8">
          <div className="skeleton h-5 w-full" />
          <div className="skeleton h-5 w-11/12" />
          <div className="skeleton h-5 w-full" />
          <div className="skeleton h-5 w-10/12" />
          <div className="skeleton h-5 w-full" />
          <div className="skeleton h-5 w-11/12" />
          <div className="skeleton h-5 w-9/12" />
          <div className="skeleton h-5 w-full" />
          <div className="skeleton h-5 w-10/12" />
          <div className="skeleton h-5 w-7/12" />
        </div>
        <div className="flex gap-1 mt-8">
          <div className="skeleton h-28 flex-[2]" />
          <div className="skeleton h-28 flex-[3]" />
          <div className="skeleton h-28 flex-[2]" />
          <div className="skeleton h-28 flex-[1]" />
        </div>
      </div>
    </main>
  );
}
