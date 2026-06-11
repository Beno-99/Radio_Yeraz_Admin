import { Ad } from "@/types";
import { format } from "date-fns";
import {
  Monitor,
  Smartphone,
  Globe,
  DollarSign,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

type AdFieldValue = string | number | boolean | undefined | null;

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (value: AdFieldValue, row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
};

export const AdColumns = (): Column<Ad>[] => [
  {
    key: "imageUrl",
    header: "Ad Preview",
    render: (value: AdFieldValue, ad: Ad) => (
      <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        {typeof value === "string" && value ? (
          <div className="relative h-full w-full">
            <Image
              src={value}
              alt={ad.title}
              fill
              className="object-cover"
            />
          </div>
        ) : ad.videoUrl ? (
          <Video className="h-6 w-6 text-gray-400" />
        ) : (
          <ImageIcon className="h-6 w-6 text-gray-400" />
        )}
      </div>
    ),
    width: "100px",
  },
  {
    key: "title",
    header: "Campaign",
    render: (value: AdFieldValue, ad: Ad) => (
      <div>
        <div className="font-medium text-gray-900 line-clamp-1">{String(value ?? "")}</div>
        <div className="text-sm text-gray-500 line-clamp-1">
          {ad.advertiserName}
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    key: "platform",
    header: "Platform",
    render: (value: AdFieldValue) => {
      const Icon =
        value === "web" ? Monitor : value === "mobile" ? Smartphone : Globe;

      const iconColor =
        value === "web"
          ? "text-blue-500"
          : value === "mobile"
          ? "text-green-500"
          : "text-purple-500";

      return (
        <div className="flex items-center">
          <Icon className={`h-4 w-4 ${iconColor} mr-1`} />
          <span className="text-sm capitalize">{String(value ?? "")}</span>
        </div>
      );
    },
    sortable: true,
  },
  {
    key: "isActive",
    header: "Status",
    render: (value: AdFieldValue) => {
      const status = value ? "Active" : "Inactive";
      const bgColor = value ? "bg-green-100" : "bg-gray-100";
      const textColor = value ? "text-green-800" : "text-gray-800";

      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
        >
          {status}
        </span>
      );
    },
    sortable: true,
  },
  {
    key: "budget",
    header: "Budget",
    render: (value: AdFieldValue) => (
      <div className="flex items-center">
        <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
        <span className="text-sm font-medium">
          ${typeof value === "number" ? value.toLocaleString() : "0"}
        </span>
      </div>
    ),
    sortable: true,
  },
  {
    key: "impressions",
    header: "Impressions",
    render: (value: AdFieldValue) => (
      <div className="text-sm text-gray-700 font-medium">
        {typeof value === "number" ? value.toLocaleString() : "0"}
      </div>
    ),
    sortable: true,
  },
  {
    key: "clicks",
    header: "Clicks",
    render: (value: AdFieldValue, ad: Ad) => {
      const clicks = typeof value === "number" ? value : 0;
      const ctr = ad.impressions ? (clicks / ad.impressions) * 100 : 0;
      return (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {clicks.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">{ctr.toFixed(2)}% CTR</div>
        </div>
      );
    },
    sortable: true,
  },
  {
    key: "startDate",
    header: "Schedule",
    render: (value: AdFieldValue, ad: Ad) => (
      <div className="text-sm text-gray-500">
        {typeof value === "string" && value
          ? format(new Date(value), "MMM d")
          : "No start"}
        {ad.endDate && ` - ${format(new Date(ad.endDate), "MMM d")}`}
      </div>
    ),
    sortable: true,
  },
];