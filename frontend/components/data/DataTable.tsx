"use client";

import React from "react";
import { Filter } from "lucide-react";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
};

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  confirmDelete?: boolean;

  pagination?: {
    page: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };

  selection?: {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
  };

  actions?: {
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onView?: (item: T) => void;
    customActions?: Array<{
      label: string;
      icon: React.ReactNode;
      onClick: (item: T) => void;
      variant?: "default" | "danger" | "success";
    }>;
  };

  filters?: React.ReactNode;
  emptyState?: React.ReactNode;
}

export function DataTable<T extends { _id: string }>({
  data,
  columns,
  loading = false,
  actions,
  filters,
  emptyState,
}: DataTableProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<T | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
        <div className="h-12 w-12 text-gray-400 mx-auto mb-4">
          <Filter className="h-full w-full" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No data found
        </h3>
        <p className="text-gray-600">
          Try adjusting your filters or create new items
        </p>
      </div>
    );
  }

  const handleConfirmDelete = () => {
    if (selectedItem && actions?.onDelete) {
      actions.onDelete(selectedItem);
    }
    setOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      {/* Filters */}
      {filters && (
        <div className="min-w-0 border-b border-gray-200 bg-gray-50 p-4">
          {filters}
        </div>
      )}

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[760px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.width ? `w-${column.width}` : ""
                  }`}
                >
                  <div
                    className={`flex items-center ${
                      column.align === "center" ? "justify-center" : ""
                    }`}
                  >
                    <span>{column.header}</span>
                  </div>
                </th>
              ))}

              {actions && (
                <th className="w-[220px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key as string}
                    className={`px-6 py-4 align-top text-sm ${
                      column.align === "center"
                        ? "text-center"
                        : column.align === "right"
                          ? "text-right"
                          : "text-left"
                    }`}
                  >
                    {column.render
                      ? column.render(
                          item[column.key as keyof T],
                          item
                        )
                      : String(item[column.key as keyof T] ?? "")}
                  </td>
                ))}

                {actions && (
                  <td className="min-w-[220px] px-6 py-4 text-sm font-medium">
                    <div className="flex flex-nowrap items-center gap-2">
                      {actions.onView && (
                        <Button
                          onClick={() => actions.onView!(item)}
                          className="text-white bg-blue-600 hover:bg-blue-800 cursor-pointer"
                        >
                          View
                        </Button>
                      )}

                      {actions.onEdit && (
                        <Button
                          onClick={() => actions.onEdit!(item)}
                          className="text-white bg-green-600 hover:bg-green-800 cursor-pointer"
                        >
                          Edit
                        </Button>
                      )}

                      {actions.onDelete && (
                        <Button
                          onClick={() => {
                            setSelectedItem(item);
                            setOpen(true);
                          }}
                          className="text-white bg-red-600 hover:bg-red-800 cursor-pointer"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setSelectedItem(null);
              }}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
