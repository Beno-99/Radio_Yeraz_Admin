// components/carousels/CarouselsFilterBar.tsx
import { Filter } from "lucide-react";

interface CarouselsFilterBarProps {
  filter: "all" | "active" | "inactive" | "pending" | "expired";
  page: number;
  total: number;
  totalCarousels: number;
  selectedCarousels: number;
  onFilterChange: (
    filter: "all" | "active" | "inactive" | "pending" | "expired",
  ) => void;
  onClearSelection: () => void;
}

export function CarouselsFilterBar({
  filter,
  page,
  total,
  totalCarousels,
  selectedCarousels,
  onFilterChange,
  onClearSelection,
}: CarouselsFilterBarProps) {
  const PAGE_LIMIT = 12;

  const filters = ["all", "active", "inactive", "pending", "expired"] as const;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-gray-500" />
        <span className="text-sm text-gray-700">Filter by:</span>

        <div className="flex flex-wrap gap-2">
          {filters.map((filterType) => (
            <button
              key={filterType}
              onClick={() => {
                onFilterChange(filterType);
                onClearSelection();
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === filterType
                  ? filterType === "all"
                    ? "bg-purple-100 text-purple-700"
                    : filterType === "active"
                      ? "bg-green-100 text-green-700"
                      : filterType === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : filterType === "expired"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
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
          {totalCarousels === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1}–
          {Math.min(page * PAGE_LIMIT, total)}
        </span>{" "}
        of <span className="font-semibold">{total}</span>{" "}
        {filter === "all" ? "carousels" : `${filter} carousels`}
        {selectedCarousels > 0 && (
          <span className="ml-2 text-purple-600">• {selectedCarousels} selected</span>
        )}
      </div>
    </div>
  );
}
