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
      <div className="max-w-3xl mx-auto p-6">
        <div className="my-4 flex items-center justify-between md:my-8">
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
        <ButtonSkeleton />
      </div>
    </main>
  );
}
