// components/carousels/CarouselsHeader.tsx
"use client";

import { Check, X, Trash2, Plus } from "lucide-react";
import { PrimaryButton } from "../posts/PrimaryButton";
import { useRouter } from "next/navigation";

interface CarouselsHeaderProps {
  selectedCarousels?: string[];
  isDeleting: boolean;
  isUpdating: boolean;
  onClearSelection: () => void;
  onBulkDelete: () => void;
}

export function CarouselsHeader({
  selectedCarousels = [],
  isDeleting,
  isUpdating,
  onClearSelection,
  onBulkDelete,
}: CarouselsHeaderProps) {
  const router = useRouter();

  const hasSelectedCarousels =
    selectedCarousels && selectedCarousels.length > 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Carousels</h1>
        <p className="text-gray-600 mt-1">
          Manage carousel images, links, scheduling, and display order
        </p>
      </div>

      <div className="flex gap-3">
        {hasSelectedCarousels ? (
          <>
            {/* Bulk Actions */}
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <Check className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                {selectedCarousels.length} selected
              </span>
            </div>

            <button
              onClick={onClearSelection}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              disabled={isDeleting || isUpdating}
            >
              <X size={16} />
              Clear
            </button>

            <button
              onClick={onBulkDelete}
              disabled={isDeleting || isUpdating}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete
                </>
              )}
            </button>
          </>
        ) : (
          <PrimaryButton
            onClick={() => router.push("/dashboard/carousels/create")}
            icon={<Plus size={18} />}
          >
            Create Carousel
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
