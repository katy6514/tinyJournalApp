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
        {/* Metadata + minimap row */}
        <div className="flex gap-4 items-start mb-6">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Date */}
            <div className="skeleton h-5 w-40" />
            {/* Legname h1 */}
            <div className="skeleton h-8 w-3/4" />
            {/* State h2 */}
            <div className="skeleton h-6 w-1/3" />
            {/* Start / End / Mileage table */}
            <div className="space-y-2 pt-1">
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
          {/* Minimap */}
          <div className="w-1/2 shrink-0">
            <div className="skeleton h-56 w-full rounded-lg" />
          </div>
        </div>

        {/* Journal text */}
        <div className="space-y-2 mb-6">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-10/12" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-9/12" />
        </div>

        {/* Photos */}
        <div className="flex gap-3 mb-6">
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
