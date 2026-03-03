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

function capitalizeFirstLetter(val: string) {
  let result = "";
  for (const word of String(val).split(" ")) {
    if (word.length > 0 && word[0] !== word[0].toUpperCase()) {
      result += word.charAt(0).toUpperCase() + word.slice(1) + " ";
    } else {
      result += word + " ";
    }
  }
  return result.trim();
}

export function parseLegName(name: string) {
  const [start, end] = name.split(" - ");
  return {
    start: capitalizeFirstLetter(start?.trim()),
    end: capitalizeFirstLetter(end?.trim()),
  };
}
