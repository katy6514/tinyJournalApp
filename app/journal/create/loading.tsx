import { BreadcrumbSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <main>
      <BreadcrumbSkeleton />
      <div className="max-w-3xl mx-auto p-6">
        <div className="card bg-base-100 dark:bg-gray-700 shadow-sm">
          <div className="card-body">
            <div className="grid gap-5 grid-cols-2">

              {/* Date selector */}
              <div className="col-span-2 md:col-span-1">
                <div className="skeleton h-4 w-32 mb-2" />
                <div className="skeleton h-10 w-full" />
              </div>

              {/* State dropdown */}
              <div className="col-span-2 md:col-span-1">
                <div className="skeleton h-4 w-16 mb-2" />
                <div className="skeleton h-10 w-full" />
              </div>

              {/* Legname */}
              <div className="col-span-2">
                <div className="skeleton h-4 w-28 mb-2" />
                <div className="skeleton h-10 w-full" />
              </div>

              {/* Journal entry textarea — h-80 matches min-h-80 */}
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
    </main>
  );
}
