// src/components/factories/PageFactory.tsx

import { useState } from "react";
import { useDataFetching } from "@/hooks/useDataFetching";
import { DataTable } from "@/components/data/DataTable";
import type { Column } from "@/components/data/DataTable";
import api from "@/lib/api/api";

interface PageFactoryProps<T> {
  title: string;
  endpoint: string;
  columns: Column<T>[];
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
  actions,
}: PageFactoryProps<T>) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, loading, pagination } = useDataFetching<T>({
    page,
    pageSize,
    fetchFunction: async ({ page, pageSize }) => {
      const response = await api.get(endpoint, {
        params: {
          page,
          pageSize,
        },
      });

      return {
        data: response.data.data ?? response.data,
        total: response.data.total ?? 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
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