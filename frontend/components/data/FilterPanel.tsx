// src/components/data/FilterPanel.tsx
"use client";

import { ReactNode, useState } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";

interface FilterPanelProps {
  children: ReactNode;
  title?: string;
  defaultExpanded?: boolean;
  onClear?: () => void;
  showClearButton?: boolean;
  className?: string;
}

export function FilterPanel({
  children,
  title = "Filters",
  defaultExpanded = true,
  onClear,
  showClearButton = true,
  className = "",
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>

        <div className="flex items-center space-x-3">
          {showClearButton && (
            <button
              onClick={handleClear}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          <div className="space-y-6">{children}</div>

          {/* Applied filters tags */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {/* Example applied filters - you can make this dynamic */}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Role: Admin
                <button className="ml-1 text-blue-600 hover:text-blue-800">
                  <X className="h-3 w-3" />
                </button>
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: Active
                <button className="ml-1 text-green-600 hover:text-green-800">
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Advanced FilterPanel with more features
interface AdvancedFilterPanelProps extends FilterPanelProps {
  filterGroups?: {
    title: string;
    children: ReactNode;
    collapsible?: boolean;
  }[];
  onApply?: () => void;
  onReset?: () => void;
}

export function AdvancedFilterPanel({
  children,
  filterGroups,
  title = "Advanced Filters",
  onApply,
  onReset,
  ...props
}: AdvancedFilterPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(
    {}
  );

  const toggleGroup = (index: number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onReset}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Reset all
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filterGroups ? (
          <div className="space-y-6">
            {filterGroups.map((group, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                {group.collapsible !== false && (
                  <button
                    onClick={() => toggleGroup(index)}
                    className="flex items-center justify-between w-full p-4 text-left"
                  >
                    <span className="font-medium text-gray-900">
                      {group.title}
                    </span>
                    {expandedGroups[index] ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                )}

                {(group.collapsible === false || expandedGroups[index]) && (
                  <div className="p-4 border-t border-gray-200">
                    {group.children}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">{children}</div>
        )}

        {/* Action buttons */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onReset}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

// Filter components for specific types
export function TextFilter({
  label,
  value,
  onChange,
  placeholder = "Type to filter...",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

export function SelectFilter({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option...",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DateRangeFilter({
  label,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  label: string;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <span className="text-xs text-gray-500 mt-1 block">From</span>
        </div>
        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <span className="text-xs text-gray-500 mt-1 block">To</span>
        </div>
      </div>
    </div>
  );
}

export function BooleanFilter({
  label,
  value,
  onChange,
  trueLabel = "Yes",
  falseLabel = "No",
  allLabel = "All",
}: {
  label: string;
  value: string | boolean | undefined;
  onChange: (value: string | boolean | undefined) => void;
  trueLabel?: string;
  falseLabel?: string;
  allLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex space-x-2">
        <button
          onClick={() => onChange(undefined)}
          className={`px-3 py-1 rounded text-sm ${
            value === undefined
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {allLabel}
        </button>
        <button
          onClick={() => onChange(true)}
          className={`px-3 py-1 rounded text-sm ${
            value === true
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {trueLabel}
        </button>
        <button
          onClick={() => onChange(false)}
          className={`px-3 py-1 rounded text-sm ${
            value === false
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {falseLabel}
        </button>
      </div>
    </div>
  );
}


