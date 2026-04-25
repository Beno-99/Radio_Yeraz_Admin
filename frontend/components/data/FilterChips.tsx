// components/data/FilterChips.tsx
"use client";

import { X } from "lucide-react";

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function FilterChips({
  filters,
  onRemove,
  onClearAll,
}: FilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 border-b border-gray-200 rounded-lg mb-4">
      <span className="text-sm text-gray-600 mr-2">Active filters:</span>
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
        >
          <span className="font-semibold">{filter.label}:</span>
          <span className="ml-1">{filter.value}</span>
          <button
            onClick={() => onRemove(filter.key)}
            className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-4 w-4" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="ml-auto text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
      >
        Clear all filters
      </button>
    </div>
  );
}
