import {
  BreadcrumbSkeleton,
  ButtonSkeleton,
  SearchSkeleton,
  JournalCardSkeleton,
  PaginationSkeleton,
} from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <main>
      <BreadcrumbSkeleton />
      <div className="flex gap-6 p-6">

        {/* Left column */}
        <div className="flex-[2] min-w-0">
          <div className="my-4 flex items-center justify-between md:my-6">
            <SearchSkeleton />
            <ButtonSkeleton />
          </div>
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <JournalCardSkeleton key={i} />
            ))}
          </div>
          <div className="mt-5 flex w-full justify-center">
            <PaginationSkeleton />
          </div>
        </div>

        {/* Right column */}
        <div className="flex-[1] min-w-0 space-y-4 mt-4 md:mt-6">
          {/* Stats card skeleton */}
          <div className="skeleton h-44 w-full rounded-xl" />
          {/* Random photo card skeleton */}
          <div className="skeleton h-72 w-full rounded-xl" />
        </div>

      </div>
    </main>
  );
}
