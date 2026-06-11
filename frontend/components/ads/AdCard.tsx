"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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

export type AdStatus = "pending" | "active" | "inactive" | "expired";

export interface AdAuthor {
  username?: string;
  displayName?: string;
}

export interface Ad {
  _id: string;
  name: string;
  image?: string;
  status?: string;
  isActive?: boolean;
  clicks?: number;
  startDate?: string;
  endDate?: string;
  targetUrl?: string;
  author?: AdAuthor | string;
}

interface AdCardProps {
  ad: Ad;
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
    } catch {
      toast.error("Failed to delete ad");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(ad._id, !isSelected);
  };

  const getImageUrl = (): string | null => {
    if (!ad.image || ad.image === "[object Object]" || imageError) {
      return null;
    }

    if (ad.image.startsWith("http")) return ad.image;

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

  const adStatus = useMemo<AdStatus>(() => {
    const raw = (ad.status || "").toLowerCase();

    if (
      raw === "pending" ||
      raw === "active" ||
      raw === "inactive" ||
      raw === "expired"
    ) {
      return raw;
    }

    return ad.isActive ? "active" : "inactive";
  }, [ad.status, ad.isActive]);

  const adStatusLabel =
    adStatus.charAt(0).toUpperCase() + adStatus.slice(1);

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
        isSelected
          ? "border-purple-500 ring-2 ring-purple-200"
          : "border-gray-200"
      }`}
    >
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              </div>
            )}

            <Image
              src={imageUrl}
              alt={ad.name}
              fill
              className={`object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
            <ImageIcon size={48} className="mb-2 text-gray-300" />
            <span className="text-xs">No image</span>
          </div>
        )}

        {onSelect && (
          <div className="absolute left-2 top-2 z-10">
            <button
              type="button"
              onClick={handleCheckboxChange}
              className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-all ${
                isSelected
                  ? "border-purple-600 bg-purple-600"
                  : "border-gray-300 bg-white"
              }`}
            >
              {isSelected && (
                <Check className="h-4 w-4 text-white" />
              )}
            </button>
          </div>
        )}

        <div
          className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-medium text-white shadow-lg ${badgeClass}`}
        >
          {adStatusLabel}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-gray-900">
          {ad.name}
        </h3>

        <div className="mb-3 flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <MousePointerClick size={14} />
            <span>{ad.clicks || 0} clicks</span>
          </div>
          <span className="text-gray-300">•</span>
          <span className={statusClass}>{adStatusLabel}</span>
        </div>

        <div className="mb-4 flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User size={14} />
            <span className="truncate">
              {typeof ad.author === "object"
                ? ad.author?.username ||
                  ad.author?.displayName ||
                  "Admin"
                : "Admin"}
            </span>
          </div>

          {ad.startDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays size={14} />
              <span>Start: {formatDate(ad.startDate)}</span>
            </div>
          )}

          {ad.endDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays size={14} />
              <span>End: {formatDate(ad.endDate)}</span>
            </div>
          )}

          {ad.targetUrl && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ExternalLink size={14} />
              <a
                href={ad.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-purple-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {ad.targetUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex gap-1">
            <Link
              href={`/dashboard/ads/${ad._id}`}
              className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            >
              <Eye size={18} />
            </Link>

            <Link
              href={`/dashboard/ads/${ad._id}/edit`}
              className="rounded-lg p-2 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
            >
              <Pencil size={18} />
            </Link>
          </div>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}