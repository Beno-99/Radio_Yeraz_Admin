// src/components/factories/PageFactory.tsx - UPDATED
import { useDataFetching } from "@/hooks/useDataFetching";
import { DataTable } from "@/components/data/DataTable";
import { FilterPanel, FilterChips } from "@/components/data/FilterPanel"; // ✅ Fixed import
import type { Column } from "@/components/data/DataTable";
import { useState } from "react";
import api from "@/lib/api/api";

interface PageFactoryProps<T> {
  title: string;
  endpoint: string;
  columns: Column<T>[];
  renderFilters?: (filters: any, setFilters: any) => React.ReactNode;
  actions?: {
    onCreate?: () => void;
    onExport?: () => void;
    onBulkAction?: (items: T[]) => void;
  };
}

export function PageFactory<T extends { _id: string }>({
  title,
  endpoint,
  columns,
  renderFilters,
  actions,
}: PageFactoryProps<T>) {
  const {
    data,
    loading,
    error,
    pagination,
    filters,
    setPage,
    setFilters,
    refetch,
  } = useDataFetching<T>({
    fetchFunction: async (params) => {
      const response = await api.get(endpoint, { params });
      return response.data;
    },
  });

  // Track active filters for chips
  const [activeFilters, setActiveFilters] = useState<
    Array<{ key: string; label: string; value: string }>
  >([]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);

    // Update active filters chips
    const chips = Object.entries(newFilters)
      .filter(
        ([_, value]) => value !== "" && value !== undefined && value !== null
      )
      .map(([key, value]) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: String(value),
      }));

    setActiveFilters(chips);
  };

  const handleRemoveFilter = (key: string) => {
    const updatedFilters = { ...filters };
    delete updatedFilters[key];
    setFilters(updatedFilters);
    setActiveFilters(activeFilters.filter((filter) => filter.key !== key));
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setActiveFilters([]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-600">
            Manage your {title.toLowerCase()} here
          </p>
        </div>
        <div className="flex space-x-3">
          {actions?.onExport && (
            <button
              onClick={actions.onExport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Export
            </button>
          )}
          {actions?.onCreate && (
            <button
              onClick={actions.onCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create New
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <FilterChips
        filters={activeFilters}
        onRemove={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* Filter Panel */}
      {renderFilters && (
        <FilterPanel
          title="Filters"
          defaultExpanded={false}
          onClear={handleClearAllFilters}
        >
          {renderFilters(filters, handleFilterChange)}
        </FilterPanel>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={data}
        columns={columns}
        loading={loading}
        pagination={{
          page: pagination.page,
          totalPages: pagination.totalPages,
          totalItems: pagination.total,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
