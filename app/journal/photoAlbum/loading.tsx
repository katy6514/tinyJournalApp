import { BreadcrumbSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <main className="bg-gray-50 dark:bg-gray-800 p-4 md:p-6">
      <BreadcrumbSkeleton />
      <div className="max-w-3xl mx-auto p-6">
        <div className="skeleton h-4 w-72 mb-6" />
        <div style={{ maxHeight: "700px", overflowY: "auto" }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton aspect-square rounded" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
