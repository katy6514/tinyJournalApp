// Loading animation
const shimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

const white = "bg-white dark:bg-gray-800";
const gray50 = "bg-gray-50 dark:bg-gray-700";
const gray100 = "bg-gray-100 dark:bg-gray-600";
const gray200 = "bg-gray-200 dark:bg-gray-500";

export function JournalCardSkeleton() {
  return (
    <div
      className={`${shimmer} grid grid-cols-3 grid-rows-3 gap-4 mb-8 pr-4 ${gray50}`}
    >
      <div className={`row-span-3 ${gray100}`}></div>
      <div className={`col-span-1 row-span-1 p-4 ${gray50}`}>
        <div className={`h-15 w-50 rounded-md ${gray200}`} />
      </div>
      <div className={`col-span-1 row-span-1 p-4 ${gray50}`}>
        <div className={`h-7 w-20 rounded-md ${gray200}`} />
      </div>
      <div className={`col-span-2 row-span-1 h-auto p-4 ${white}`}></div>
      <div className="col-span-2 row-span-1">
        <div className={`h-10 w-20 rounded-md ${gray200}`} />
      </div>
    </div>
  );
}

// export function JournalCardSkeleton() {
//   return (
//     <div
//       className={` ${shimmer} grid grid-cols-3 grid-rows-3 gap-4 mb-8 pr-4 bg-gray-50 dark:bg-gray-600`}
//     >
//       <div className="row-span-3 bg-gray-100 dark:bg-gray-700"></div>

//       <div className="col-span-1 row-span-1 p-4 bg-gray-50 dark:bg-gray-800">
//         <div className="h-15 w-50 rounded-md bg-gray-200" />
//       </div>
//       <div className="col-span-1 row-span-1 p-4 bg-gray-50 dark:bg-gray-800">
//         <div className="h-7 w-20 rounded-md bg-gray-200" />
//       </div>
//       <div className="col-span-2 row-span-1 h-auto p-4 bg-white dark:bg-gray-800"></div>
//       <div className="col-span-2 row-span-1">
//         <div className="h-10 w-20 rounded-md bg-gray-200" />
//       </div>
//     </div>
//   );
// }
