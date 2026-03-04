"use client";

import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue",
          currentPage === 1
            ? "text-ptba-light-gray cursor-not-allowed"
            : "text-ptba-navy hover:bg-ptba-section-bg"
        )}
      >
        Previous
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) =>
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 py-2 text-sm text-ptba-gray"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "min-w-[36px] h-9 px-2 text-sm font-medium rounded-lg transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue",
              page === currentPage
                ? "bg-ptba-navy text-white"
                : "text-ptba-charcoal hover:bg-ptba-section-bg"
            )}
          >
            {page}
          </button>
        )
      )}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ptba-steel-blue",
          currentPage === totalPages
            ? "text-ptba-light-gray cursor-not-allowed"
            : "text-ptba-navy hover:bg-ptba-section-bg"
        )}
      >
        Next
      </button>
    </nav>
  );
}
