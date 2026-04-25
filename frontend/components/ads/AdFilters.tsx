import { FilterPanel } from "@/components/data/FilterPanel";
import { Search } from "lucide-react";

interface AdFiltersProps {
  filters: Record<string, any>;
  sort: {
    field: string;
    direction: "asc" | "desc";
  };
  onFilterChange: (filters: Record<string, any>) => void;
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
      onClear={() => onFilterChange({})}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={filters.isActive || "all"}
            onChange={(e) =>
              onFilterChange({ ...filters, isActive: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Platform
          </label>
          <select
            value={filters.platform || "all"}
            onChange={(e) =>
              onFilterChange({ ...filters, platform: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">All Platforms</option>
            <option value="web">Web Only</option>
            <option value="mobile">Mobile Only</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Sort By
          </label>
          <select
            value={sort.field || "createdAt"}
            onChange={(e) => onSortChange(e.target.value, sort.direction)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
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

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Ads
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by title, advertiser, or description..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </FilterPanel>
  );
}
