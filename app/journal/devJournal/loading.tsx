import { BreadcrumbSkeleton } from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <main>
      <BreadcrumbSkeleton />
      <div className="max-w-3xl mx-auto p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mb-8">
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
