import { BreadcrumbSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <main className="bg-gray-50 dark:bg-gray-800 p-4 md:p-6">
      <BreadcrumbSkeleton />
      <div className="bg-gray-50 p-4 md:p-6 mt-4">
        <div className="grid gap-6 mb-6 grid-cols-2">
          {/* Date heading */}
          <div className="col-span-1">
            <div className="skeleton h-7 w-48" />
          </div>

          {/* State dropdown */}
          <div className="col-span-1">
            <div className="skeleton h-4 w-16 mb-2" />
            <div className="skeleton h-10 w-full" />
          </div>

          {/* Legname */}
          <div className="col-span-2">
            <div className="skeleton h-4 w-28 mb-2" />
            <div className="skeleton h-10 w-full" />
          </div>

          {/* Journal entry textarea */}
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
    </main>
  );
}
