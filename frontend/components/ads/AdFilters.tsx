import { FilterPanel } from "@/components/data/FilterPanel";
import { Search } from "lucide-react";

export type AdFiltersState = {
  isActive?: "all" | "true" | "false";
  platform?: "all" | "web" | "mobile" | "both";
  search?: string;
};

export type AdSortState = {
  field: string;
  direction: "asc" | "desc";
};

interface AdFiltersProps {
  filters: AdFiltersState;
  sort: AdSortState;
  onFilterChange: (filters: AdFiltersState) => void;
  onSortChange: (field: string, direction?: "asc" | "desc") => void;
  onSearch: (search: string) => void;
}

export default function AdFilters({
  filters,
  sort,
  onFilterChange,
  onSortChange,
  onSearch,
}: AdFiltersProps) {
  return (
    <FilterPanel
      title="Ad Filters"
      defaultExpanded={false}
      onClear={() =>
        onFilterChange({
          isActive: "all",
          platform: "all",
          search: "",
        })
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* STATUS */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={filters.isActive ?? "all"}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                isActive: e.target.value as AdFiltersState["isActive"],
              })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* PLATFORM */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Platform
          </label>
          <select
            value={filters.platform ?? "all"}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                platform: e.target.value as AdFiltersState["platform"],
              })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="all">All Platforms</option>
            <option value="web">Web Only</option>
            <option value="mobile">Mobile Only</option>
            <option value="both">Both</option>
          </select>
        </div>

        {/* SORT */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Sort By
          </label>
          <select
            value={sort.field || "createdAt"}
            onChange={(e) =>
              onSortChange(e.target.value, sort.direction)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="createdAt">Created Date</option>
            <option value="title">Title</option>
            <option value="budget">Budget</option>
            <option value="impressions">Impressions</option>
            <option value="clicks">Clicks</option>
            <option value="startDate">Start Date</option>
          </select>
        </div>
      </div>

      {/* SEARCH */}
      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Search Ads
        </label>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search by title, advertiser, or description..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4"
          />
        </div>
      </div>
    </FilterPanel>
  );
}