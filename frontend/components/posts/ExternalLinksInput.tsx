"use client";

import { useEffect, useRef, useState } from "react";
import { Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import {
  MAX_EXTERNAL_LINKS,
  parseExternalLinks,
  serializeExternalLinks,
} from "@/lib/postLinks";
import { cn } from "@/lib/utils";

interface ExternalLinksInputProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

const createRows = (value?: string | null) => {
  const links = parseExternalLinks(value);
  return links.length > 0 ? links : [""];
};

export function ExternalLinksInput({
  value,
  onChange,
  disabled = false,
  error = false,
}: ExternalLinksInputProps) {
  const valueKey = value ?? "";
  const emittedValueRef = useRef<string | null>(null);
  const [rows, setRows] = useState<string[]>(() => createRows(valueKey));

  useEffect(() => {
    if (emittedValueRef.current === valueKey) {
      emittedValueRef.current = null;
      return;
    }

    const nextRows = createRows(valueKey);
    const timer = setTimeout(() => {
      setRows(nextRows);
    }, 0);

    return () => clearTimeout(timer);
  }, [valueKey]);

  const updateRows = (nextRows: string[]) => {
    const serialized = serializeExternalLinks(nextRows);

    emittedValueRef.current = serialized;
    setRows(nextRows);
    onChange(serialized);
  };

  const handleChange = (index: number, nextValue: string) => {
    setRows((currentRows) => {
      const nextRows = currentRows.map((row, rowIndex) =>
        rowIndex === index ? nextValue : row,
      );
      const serialized = serializeExternalLinks(nextRows);

      emittedValueRef.current = serialized;
      onChange(serialized);

      return nextRows;
    });
  };

  const handleAdd = () => {
    if (rows.length >= MAX_EXTERNAL_LINKS) return;
    setRows((currentRows) =>
      currentRows.length >= MAX_EXTERNAL_LINKS ? currentRows : [...currentRows, ""],
    );
  };

  const handleRemove = (index: number) => {
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
    updateRows(nextRows.length > 0 ? nextRows : [""]);
  };

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <LinkIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="url"
              value={row}
              onChange={(event) => handleChange(index, event.target.value)}
              disabled={disabled}
              placeholder={
                index === 0
                  ? "https://example.com/article"
                  : "https://facebook.com/... or https://youtube.com/..."
              }
              className={cn(
                "block min-h-11 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400",
                error && "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500",
              )}
            />
          </div>

          <button
            type="button"
            onClick={() => handleRemove(index)}
            disabled={disabled || rows.length === 1}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Remove link"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled || rows.length >= MAX_EXTERNAL_LINKS}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add Link
      </button>

      <p className="text-sm text-gray-600">
        Add up to {MAX_EXTERNAL_LINKS} external links. Each link will appear as a
        separate row in the mobile app.
      </p>
    </div>
  );
}
