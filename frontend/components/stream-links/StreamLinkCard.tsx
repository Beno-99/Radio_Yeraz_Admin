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

      <div className="p-4 pt-12 sm:p-5 sm:pt-12">
        <div className="mb-4 flex min-w-0 items-start justify-between">
          <div className="min-w-0">
            <h3 className="mb-2 line-clamp-2 break-words text-lg font-semibold">{streamLink.title}</h3>
            <a
              href={streamLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1 break-all text-sm text-blue-600 hover:underline"
            >
              {streamLink.url}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>
        </div>

        {streamLink.description && (
          <p className="mb-4 line-clamp-2 break-words text-sm text-gray-600">
            {streamLink.description}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
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
              className="min-h-11 min-w-11 rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(streamLink._id)}
              className="min-h-11 min-w-11 rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
