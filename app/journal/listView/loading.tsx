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
      <div className="my-4 flex justify-end md:my-8">
        <ButtonSkeleton />
      </div>
      <div className="flex items-center gap-2 pb-8">
        <SearchSkeleton />
      </div>
      <div>
        {Array.from({ length: 6 }).map((_, i) => (
          <JournalCardSkeleton key={i} />
        ))}
      </div>
      <div className="mt-5 flex w-full justify-center">
        <PaginationSkeleton />
      </div>
    </main>
  );
}
