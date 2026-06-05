// Loading animation — requires @keyframes shimmer defined in globals.css
// Container must have `relative overflow-hidden` for before: pseudo-element to work
const shimmer = `before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-white/10 before:to-transparent`;

const bgWhite = "bg-white dark:bg-gray-800";
const bgGray100 = "bg-gray-100 dark:bg-gray-600";
const bgGray200 = "bg-gray-200 dark:bg-gray-500";

export function BreadcrumbSkeleton() {
  return (
    <div className={`${shimmer} relative overflow-hidden h-8 w-48 rounded-md ${bgGray200}`} />
  );
}

export function ButtonSkeleton() {
  return (
    <div className={`${shimmer} relative overflow-hidden h-10 w-32 rounded-md ${bgGray200}`} />
  );
}

export function SearchSkeleton() {
  return (
    <div className={`${shimmer} relative overflow-hidden h-8 w-64 rounded-md ${bgGray200}`} />
  );
}

export function PaginationSkeleton() {
  return (
    <div className={`${shimmer} relative overflow-hidden h-10 w-64 rounded-md ${bgGray200}`} />
  );
}

export function JournalCardSkeleton() {
  return (
    <div className={`${shimmer} relative overflow-hidden card card-side ${bgWhite} shadow-sm mb-4`}>
      {/* Photo — fixed w-48 matching actual figure */}
      <figure className={`w-48 shrink-0 min-h-[140px] ${bgGray200}`} />
      {/* Card body */}
      <div className="card-body gap-2">
        <div className={`h-6 w-3/4 rounded-md ${bgGray200}`} />
        <div className={`h-4 w-1/2 rounded-md ${bgGray200}`} />
        <div className={`h-3 w-1/3 rounded-md ${bgGray200}`} />
        <div className={`h-4 w-full rounded-md ${bgGray100}`} />
        <div className={`h-4 w-4/5 rounded-md ${bgGray100}`} />
      </div>
    </div>
  );
}

