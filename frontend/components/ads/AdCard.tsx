import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  ExternalLink,
  User,
  Image as ImageIcon,
  MousePointerClick,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { adsAPI } from "@/lib/api/api";

interface AdCardProps {
  ad: any;
  mediaUrl: string;
  onDelete: () => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export function AdCard({
  ad,
  mediaUrl,
  onDelete,
  isSelected = false,
  onSelect,
}: AdCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: `Delete "${ad.name}"?`,
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      await adsAPI.deleteAd(ad._id);
      toast.success("Ad deleted successfully");
      onDelete();
    } catch (error) {
      toast.error("Failed to delete ad");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelect) {
      onSelect(ad._id, !isSelected);
    }
  };

  const getImageUrl = () => {
    if (!ad.image || ad.image === "[object Object]" || imageError) {
      return null;
    }

    if (ad.image.startsWith("http")) {
      return ad.image;
    }

    if (ad.image.startsWith("/uploads/")) {
      return `${mediaUrl}${ad.image}`;
    }

    return `${mediaUrl}/uploads/ads/${ad.image}`;
  };

  const imageUrl = getImageUrl();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const adStatus = useMemo(() => {
    const raw = (ad.status || "").toString().toLowerCase();
    if (["pending", "active", "inactive", "expired"].includes(raw)) {
      return raw as "pending" | "active" | "inactive" | "expired";
    }
    return ad.isActive ? "active" : "inactive";
  }, [ad.status, ad.isActive]);

  const adStatusLabel = adStatus.charAt(0).toUpperCase() + adStatus.slice(1);

  const statusClass =
    adStatus === "active"
      ? "text-green-600"
      : adStatus === "pending"
        ? "text-amber-600"
        : adStatus === "expired"
          ? "text-red-600"
          : "text-gray-500";

  const badgeClass =
    adStatus === "active"
      ? "bg-green-500"
      : adStatus === "pending"
        ? "bg-amber-500"
        : adStatus === "expired"
          ? "bg-red-500"
          : "bg-gray-500";

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full ${
        isSelected ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200"
      }`}
    >
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
            )}
            <img
              src={imageUrl}
              alt={ad.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.log("❌ Image failed to load:", imageUrl);
                setImageError(true);
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <ImageIcon size={48} className="mb-2 text-gray-300" />
            <span className="text-xs">No image</span>
          </div>
        )}

        {onSelect && (
          <div
            className="absolute top-2 left-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCheckboxChange}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-purple-600 border-purple-600 hover:bg-purple-700"
                  : "bg-white border-gray-300 hover:border-purple-400"
              }`}
            >
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </button>
          </div>
        )}

        <div
          className={`absolute top-2 right-2 px-2 py-1 text-white text-xs font-medium rounded-full shadow-lg ${badgeClass}`}
        >
          {adStatusLabel}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1 mb-2">
          {ad.name}
        </h3>

        <div className="flex items-center gap-3 mb-3 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <MousePointerClick size={14} className="text-gray-400" />
            <span>{ad.clicks || 0} clicks</span>
          </div>
          <span className="text-gray-300">•</span>
          <span className={statusClass}>{adStatusLabel}</span>
        </div>

        <div className="space-y-2 mb-4 flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">
              {typeof ad.author === "object"
                ? ad.author?.username || ad.author?.displayName || "Admin"
                : "Admin"}
            </span>
          </div>

          {ad.startDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays size={14} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">
                Start: {formatDate(ad.startDate)}
              </span>
            </div>
          )}

          {ad.endDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays size={14} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">End: {formatDate(ad.endDate)}</span>
            </div>
          )}

          {ad.targetUrl && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
              <a
                href={ad.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {ad.targetUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          <div className="flex gap-1">
            <Link
              href={`/dashboard/ads/${ad._id}`}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View ad"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye size={18} />
            </Link>
            <Link
              href={`/dashboard/ads/${ad._id}/edit`}
              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Edit ad"
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil size={18} />
            </Link>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete ad"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
