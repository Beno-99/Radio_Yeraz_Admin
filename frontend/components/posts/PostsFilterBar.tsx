// components/posts/PostsFilterBar.tsx
import { Filter } from "lucide-react";

interface PostsFilterBarProps {
  filter: "all" | "published" | "draft" | "live";
  page: number;
  total: number;
  totalPosts: number;
  selectedPosts: number;
  onFilterChange: (filter: "all" | "published" | "draft" | "live") => void;
  onClearSelection: () => void;
}

export function PostsFilterBar({
  filter,
  page,
  total,
  totalPosts,
  selectedPosts,
  onFilterChange,
  onClearSelection,
}: PostsFilterBarProps) {
  const PAGE_LIMIT = 12;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-gray-500" />
        <span className="text-sm text-gray-700">Filter by:</span>
        <div className="flex gap-2">
          {["all", "published", "draft", "live"].map((filterType) => (
            <button
              key={filterType}
              onClick={() => {
                onFilterChange(filterType as any);
                onClearSelection();
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === filterType
                  ? filterType === "all"
                    ? "bg-blue-100 text-blue-700"
                    : filterType === "published"
                      ? "bg-green-100 text-green-700"
                      : filterType === "draft"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Showing{" "}
        <span className="font-semibold">
          {totalPosts === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1}–
          {Math.min(page * PAGE_LIMIT, total)}
        </span>{" "}
        of <span className="font-semibold">{total}</span>{" "}
        {filter === "all" ? "posts" : `${filter} posts`}
        {selectedPosts > 0 && (
          <span className="ml-2 text-blue-600">• {selectedPosts} selected</span>
        )}
      </div>
    </div>
  );
}
