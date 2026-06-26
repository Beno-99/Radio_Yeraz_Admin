import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

interface PostHeaderProps {
  id: string;
  title?: string;
  isLive: boolean;
  onBack: () => void;
}

export function PostHeader({ id, title, isLive, onBack }: PostHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="hidden sm:block text-gray-400">/</div>
        <div className="text-sm text-gray-500 truncate max-w-xs">
          {title ? title : `Post #${id}`}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge isLive={isLive} />
        <Link
          href={`/dashboard/posts/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Pencil size={16} />
          Edit Post
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ isLive }: { isLive: boolean }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
          isLive
            ? "bg-red-100 text-red-700 border border-red-200"
            : "bg-gray-100 text-gray-700 border border-gray-200"
        }`}
    >
      {isLive ? "Published" : "Draft"}
    </span>
  );
}
