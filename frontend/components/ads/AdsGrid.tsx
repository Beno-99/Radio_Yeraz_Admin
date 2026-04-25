// components/ads/AdsGrid.tsx
import { AdCard } from "./AdCard";
import { Check } from "lucide-react";

interface AdsGridProps {
  ads: any[];
  mediaUrl: string;
  onAdDeleted: () => void;
  loading: boolean;
  selectedAds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function AdsGrid({
  ads,
  mediaUrl,
  onAdDeleted,
  loading,
  selectedAds = [],
  onSelectionChange,
}: AdsGridProps) {
  const handleSelect = (adId: string, selected: boolean) => {
    if (!onSelectionChange) return;

    const newSelection = selected
      ? [...selectedAds, adId]
      : selectedAds.filter((id) => id !== adId);

    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedAds.length === ads.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(ads.map((ad) => ad._id));
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
            <div className="h-48 bg-gray-200"></div>
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="flex gap-2 pt-4">
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="text-5xl mb-4">📢</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No ads found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Create your first ad to get started. Click the "Create Ad" button
          above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection Header */}
      {selectedAds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-purple-600 rounded flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-purple-800">
              {selectedAds.length} ad{selectedAds.length !== 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>
          <button
            onClick={handleSelectAll}
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            {selectedAds.length === ads.length ? "Deselect all" : "Select all"}
          </button>
        </div>
      )}

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {ads.map((ad) => (
          <AdCard
            key={ad._id}
            ad={ad}
            mediaUrl={mediaUrl}
            onDelete={onAdDeleted}
            isSelected={selectedAds.includes(ad._id)}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
