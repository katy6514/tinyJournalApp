import { BreadcrumbSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <main>
      <BreadcrumbSkeleton />
      <div className="flex gap-8 p-6">

        {/* Left column: metadata card + photos card */}
        <div className="w-1/3 shrink-0 space-y-4">

          {/* Metadata card */}
          <div className="card bg-base-100 dark:bg-gray-700 shadow-sm border border-base-200 dark:border-gray-600">
            <div className="card-body p-5 space-y-1">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-7 w-48" />
              <div className="skeleton h-6 w-24" />
              <div className="divider my-1" />
              <div className="space-y-1.5">
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
          </div>

          {/* Photos card — one photo per row matching maxPhotosPerRow={1} */}
          <div className="card bg-base-100 dark:bg-gray-700 shadow-sm border border-base-200 dark:border-gray-600">
            <div className="card-body p-5">
              <div className="skeleton h-3 w-28 mb-2" />
              <div className="space-y-2">
                <div className="skeleton h-40 w-full" />
                <div className="skeleton h-32 w-full" />
              </div>
            </div>
          </div>

        </div>

        {/* Right column: form — edit mode: no date selector, state is full-width */}
        <div className="flex-1 min-w-0">
          <div className="card bg-base-100 dark:bg-gray-700 shadow-sm">
            <div className="card-body">
              <div className="grid gap-5 grid-cols-2">
                <div className="col-span-2">
                  <div className="skeleton h-4 w-16 mb-2" />
                  <div className="skeleton h-10 w-full" />
                </div>
                <div className="col-span-2">
                  <div className="skeleton h-4 w-28 mb-2" />
                  <div className="skeleton h-10 w-full" />
                </div>
                <div className="col-span-2">
                  <div className="skeleton h-4 w-28 mb-2" />
                  <div className="skeleton h-80 w-full" />
                </div>
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
