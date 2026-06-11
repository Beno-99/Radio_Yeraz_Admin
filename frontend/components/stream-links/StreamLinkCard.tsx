// src/components/stream-links/StreamLinkCard.tsx
import { Edit2, Trash2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { StreamLink } from '@/types';

interface StreamLinkCardProps {
  streamLink: StreamLink;
  onEdit: (link: StreamLink) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function StreamLinkCard({
  streamLink,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
}: StreamLinkCardProps) {
  return (
    <div className={`relative bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Selection Checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => onSelect(streamLink._id)}
          className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-all ${
            isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 hover:border-blue-400'
          }`}
        >
          {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
        </button>
      </div>

      <div className="p-5 pt-12">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 mb-2">{streamLink.title}</h3>
            <a
              href={streamLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm flex items-center gap-1 break-all"
            >
              {streamLink.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {streamLink.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {streamLink.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            {streamLink.isActive ? (
              <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                <CheckCircle className="w-4 h-4" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                <XCircle className="w-4 h-4" />
                Inactive
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(streamLink)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-blue-600 transition"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(streamLink._id)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-red-600 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}