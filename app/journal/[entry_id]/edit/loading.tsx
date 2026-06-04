import { BreadcrumbSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <main>
      <BreadcrumbSkeleton />
      <div className="flex gap-8 p-6">

        {/* Left column: metadata + photos */}
        <div className="w-1/3 shrink-0 space-y-6">
          <div className="space-y-1">
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-7 w-48" />
            <div className="skeleton h-6 w-24" />
            <div className="space-y-1.5 pt-3">
              <div className="flex gap-3">
                <div className="skeleton h-4 w-12" />
                <div className="skeleton h-4 w-32" />
              </div>
              <div className="flex gap-3">
                <div className="skeleton h-4 w-12" />
                <div className="skeleton h-4 w-32" />
              </div>
              <div className="flex gap-3">
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-16" />
              </div>
            </div>
          </div>
          <div>
            <div className="skeleton h-3 w-28 mb-2" />
            <div className="flex gap-1">
              <div className="skeleton h-24 flex-[2]" />
              <div className="skeleton h-24 flex-[3]" />
              <div className="skeleton h-24 flex-[2]" />
            </div>
          </div>
        </div>

        {/* Right column: form */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 md:p-6">
            <div className="grid gap-6 mb-6 grid-cols-2">
              <div className="col-span-1">
                <div className="skeleton h-7 w-48" />
              </div>
              <div className="col-span-1">
                <div className="skeleton h-4 w-16 mb-2" />
                <div className="skeleton h-10 w-full" />
              </div>
              <div className="col-span-2">
                <div className="skeleton h-4 w-28 mb-2" />
                <div className="skeleton h-10 w-full" />
              </div>
              <div className="col-span-2">
                <div className="skeleton h-4 w-28 mb-2" />
                <div className="skeleton h-48 w-full" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <div className="skeleton h-10 w-24" />
            <div className="skeleton h-10 w-28" />
          </div>
        </div>

      </div>
    </main>
  );
}
