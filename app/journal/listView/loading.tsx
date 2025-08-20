import {
  BreadcrumbSkeleton,
  SearchSkeleton,
  JournalCardSkeleton,
} from "@/app/ui/skeletons";

export default function Loading() {
  return (
    <>
      <BreadcrumbSkeleton /> <SearchSkeleton />
      <JournalCardSkeleton />
    </>
  );
}
