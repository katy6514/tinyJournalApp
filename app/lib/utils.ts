// import { Revenue } from './definitions';

// export const formatCurrency = (amount: number) => {
//   return (amount / 100).toLocaleString('en-US', {
//     style: 'currency',
//     currency: 'USD',
//   });
// };

// export const formatDateToLocal = (
//   dateStr: string,
//   locale: string = 'en-US',
// ) => {
//   const date = new Date(dateStr);
//   const options: Intl.DateTimeFormatOptions = {
//     day: 'numeric',
//     month: 'short',
//     year: 'numeric',
//   };
//   const formatter = new Intl.DateTimeFormat(locale, options);
//   return formatter.format(date);
// };

export const generatePagination = (currentPage: number, totalPages: number) => {
  // If total pages fits within the max window size, show all with no ellipsis.
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Show a window of ±2 pages around the current page, with first/last anchors.
  const windowStart = Math.max(1, currentPage - 2);
  const windowEnd = Math.min(totalPages, currentPage + 2);

  const pages: (number | string)[] = [];

  // Prepend first page (and ellipsis if there's a gap)
  if (windowStart > 2) {
    pages.push(1, "...");
  } else if (windowStart === 2) {
    pages.push(1);
  }

  for (let i = windowStart; i <= windowEnd; i++) {
    pages.push(i);
  }

  // Append last page (and ellipsis if there's a gap)
  if (windowEnd < totalPages - 1) {
    pages.push("...", totalPages);
  } else if (windowEnd === totalPages - 1) {
    pages.push(totalPages);
  }

  return pages;
};
