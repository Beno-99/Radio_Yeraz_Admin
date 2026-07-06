// components/carousels/CarouselsPagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselsPaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function CarouselsPagination({
  page,
  totalPages,
  onChange,
}: CarouselsPaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft size={20} />
      </button>

      {getPageNumbers().map((pageNum, index) =>
        pageNum === -1 ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={pageNum}
            onClick={() => onChange(pageNum)}
            className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-colors ${
              page === pageNum
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {pageNum}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
