// components/carousels/CarouselsGrid.tsx
import { CarouselCard } from "./CarouselCard";
import { Check } from "lucide-react";

export interface Carousel {
  _id: string;
  name: string;
  image?: string;
  isActive?: boolean;
  status?: string;
  clicks?: number;
  startDate?: string;
  endDate?: string;
  targetUrl?: string;
  author?: {
    username?: string;
    displayName?: string;
  };
}

interface CarouselsGridProps {
  carousels: Carousel[];
  mediaUrl: string;
  onCarouselDeleted: () => void;
  loading: boolean;
  selectedCarousels?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function CarouselsGrid({
  carousels,
  mediaUrl,
  onCarouselDeleted,
  loading,
  selectedCarousels = [],
  onSelectionChange,
}: CarouselsGridProps) {
  const handleSelect = (carouselId: string, selected: boolean) => {
    if (!onSelectionChange) return;

    const newSelection = selected
      ? [...selectedCarousels, carouselId]
      : selectedCarousels.filter((id) => id !== carouselId);

    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedCarousels.length === carousels.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(carousels.map((carousel) => carousel._id));
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-gray-200" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (carousels.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="text-5xl mb-4">📢</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No carousels found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Create your first carousel to get started. Click the {"Create Carousel"} button above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection Header */}
      {selectedCarousels.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-purple-600 rounded flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-purple-800">
              {selectedCarousels.length} carousel{selectedCarousels.length !== 1 ? "s" : ""} selected
            </span>
          </div>

          <button
            onClick={handleSelectAll}
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            {selectedCarousels.length === carousels.length ? "Deselect all" : "Select all"}
          </button>
        </div>
      )}

      {/* Carousels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {carousels.map((carousel) => (
          <CarouselCard
            key={carousel._id}
            carousel={carousel}
            mediaUrl={mediaUrl}
            onDelete={onCarouselDeleted}
            isSelected={selectedCarousels.includes(carousel._id)}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
