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
        {/* Legname h1 */}
        <div className="skeleton h-7 w-2/3 mb-4" />
        {/* State h2 */}
        <div className="skeleton h-6 w-1/4 mb-4" />
        {/* Date h2 */}
        <div className="skeleton h-5 w-1/3 mb-4" />
        {/* Edit button */}
        <div className="skeleton h-9 w-24 mb-6" />

        {/* Body: journal text + mini map */}
        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-10/12" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-9/12" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-10/12" />
          </div>
          <div className="w-[40%] shrink-0">
            <div className="skeleton h-56 w-full rounded-lg" />
          </div>
        </div>

        {/* Photos */}
        <div className="flex gap-3 mt-6">
          <div className="skeleton h-24 w-24 rounded" />
          <div className="skeleton h-24 w-24 rounded" />
          <div className="skeleton h-24 w-24 rounded" />
        </div>
      </div>
    </main>
  );
}
