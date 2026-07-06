// src/components/stream-links/StreamLinksGrid.tsx
import { Check } from "lucide-react";
import { StreamLinkCard } from "./StreamLinkCard";
import { StreamLink } from "@/types";

interface StreamLinksGridProps {
  streamLinks: StreamLink[];
  onDelete: (id: string) => void;
  onEdit: (link: StreamLink) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  loading: boolean;
  selectedLinks?: string[];
}

export function StreamLinksGrid({
  streamLinks,
  onDelete,
  onEdit,
  onSelectionChange,
  loading,
  selectedLinks = [],
}: StreamLinksGridProps) {
  const isChecked = (id: string) => selectedLinks.includes(id);

  const handleSelect = (id: string) => {
    const newSelection = isChecked(id)
      ? selectedLinks.filter((linkId) => linkId !== id)
      : [...selectedLinks, id];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedLinks.length === streamLinks.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(streamLinks.map((link) => link._id));
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse h-80" />
        ))}
      </div>
    );
  }

  if (streamLinks.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
        <div className="text-6xl mb-4">🔗</div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">No stream links yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Create your first stream link to start sharing live streams.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selection Bar */}
      {selectedLinks.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-blue-800">
              {selectedLinks.length} link{selectedLinks.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectedLinks.length === streamLinks.length ? "Deselect all" : "Select all"}
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {streamLinks.map((link) => (
          <StreamLinkCard
            key={link._id}
            streamLink={link}
            onEdit={onEdit}
            onDelete={onDelete}
            isSelected={isChecked(link._id)}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
