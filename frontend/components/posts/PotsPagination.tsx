interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function PostPagination({
  page,
  totalPages,
  onChange,
}: PaginationProps) {
  return (
    <div className="flex justify-end items-center gap-3 mt-6">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </button>

      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
