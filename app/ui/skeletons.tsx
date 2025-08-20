// Loading animation
const shimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

const white = "bg-white dark:bg-gray-800";
const gray50 = "bg-gray-50 dark:bg-gray-700";
const gray100 = "bg-gray-100 dark:bg-gray-600";
const gray150 = "bg-gray-150 dark:bg-gray-500";

export function BreadcrumbSkeleton() {
  return <div className={`h-10 w-20 rounded-md ${gray150}`} />;
}

export function SearchSkeleton() {
  return (
    <div
      className={`${shimmer} grid grid-cols-3 grid-rows-3 gap-4 mb-8 pr-4 ${gray50}`}
    ></div>
  );
}

export function JournalCardSkeleton() {
  return (
    <div
      className={`${shimmer} grid grid-cols-3 grid-rows-3 gap-4 mb-8 pr-4 ${gray50}`}
    >
      <div className={`row-span-3 ${gray100}`}></div>
      <div className={`col-span-1 row-span-1 p-4 ${gray50}`}>
        <div className={`h-15 w-50 rounded-md ${gray150}`} />
      </div>
      <div className={`col-span-1 row-span-1 p-4 ${gray50}`}>
        <div className={`h-7 w-20 rounded-md ${gray150}`} />
      </div>
      <div className={`col-span-2 row-span-1 h-auto p-4 ${white}`}></div>
      <div className="col-span-2 row-span-1">
        <div className={`h-10 w-20 rounded-md ${gray150}`} />
      </div>
    </div>
  );
}
