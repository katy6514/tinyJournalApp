import { BreadcrumbSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <main className="bg-gray-50 dark:bg-gray-800 p-4 md:p-6">
      <BreadcrumbSkeleton />
      <div className="max-w-3xl mx-auto p-6 space-y-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton h-6 w-64 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="skeleton h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
