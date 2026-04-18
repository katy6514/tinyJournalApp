export default function Loading() {
  return (
    <main>
      {/* Breadcrumbs */}
      <div className="flex gap-2 px-4 py-2">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-4 w-4" />
        <div className="skeleton h-4 w-24" />
      </div>

      {/* Prev / Next navigation */}
      <div className="flex justify-between px-4 py-2">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-4 w-40" />
      </div>

      {/* Content area */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 md:p-6">
        {/* Grid: col 1 = metadata + journal text, col 2 = minimap spanning both rows */}
        <div className="grid grid-cols-[1fr_50%] gap-4 items-start">

          {/* Metadata row */}
          <div className="flex justify-between gap-6 mb-6">
            {/* Date / title / state */}
            <div className="space-y-3">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-8 w-48" />
              <div className="skeleton h-6 w-28" />
            </div>
            {/* Start / End / Mileage */}
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
        <div className="flex gap-3 mt-6 mb-6">
          <div className="skeleton h-24 w-24 rounded" />
          <div className="skeleton h-24 w-24 rounded" />
          <div className="skeleton h-24 w-24 rounded" />
        </div>

        {/* Edit button */}
        <div className="flex justify-end">
          <div className="skeleton h-10 w-24" />
        </div>
      </div>
    </main>
  );
}
