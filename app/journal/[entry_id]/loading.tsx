import { BreadcrumbSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <main>
      <BreadcrumbSkeleton />
      <div className="max-w-3xl mx-auto p-6">

        {/* Prev / Next navigation */}
        <div className="flex justify-between py-2 text-sm mb-4">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-4 w-40" />
        </div>

        <div>
          {/* Grid: col 1 = metadata + journal text, col 2 = minimap */}
          <div className="grid grid-cols-[1fr_50%] gap-4 items-start">

            {/* Metadata row */}
            <div className="flex justify-between gap-6 mb-6">
              {/* Date / title / state */}
              <div className="space-y-3">
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-8 w-48" />
                <div className="skeleton h-6 w-28" />
              </div>
              {/* Start / End / Mileage table */}
              <div className="space-y-2 mt-1">
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

            {/* Minimap — spans metadata + journal text rows */}
            <div className="row-span-2">
              <div className="skeleton h-56 w-full rounded-lg" />
            </div>

            {/* Journal text */}
            <div className="space-y-2">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-11/12" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-10/12" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-11/12" />
              <div className="skeleton h-4 w-9/12" />
            </div>

          </div>

          {/* Photos */}
          <div className="flex gap-3 mt-8 mb-6">
            <div className="skeleton h-24 w-24 rounded" />
            <div className="skeleton h-24 w-24 rounded" />
            <div className="skeleton h-24 w-24 rounded" />
          </div>

          {/* Edit button */}
          <div className="mt-6 flex justify-end">
            <div className="skeleton h-10 w-24" />
          </div>
        </div>

      </div>
    </main>
  );
}
