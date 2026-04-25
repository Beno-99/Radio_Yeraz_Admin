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
import type { ReactNode } from "react";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
};

export const AdColumns = (): Column<Ad>[] => [
  {
    key: "imageUrl",
    header: "Ad Preview",
    render: (value: string, ad: Ad) => (
      <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        {value ? (
          <img
            src={value}
            alt={ad.title}
            className="h-full w-full object-cover"
          />
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
    render: (value: string, ad: Ad) => (
      <div>
        <div className="font-medium text-gray-900 line-clamp-1">{value}</div>
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
    render: (value: string) => {
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
          <span className="text-sm capitalize">{value}</span>
        </div>
      );
    },
    sortable: true,
  },
  {
    key: "isActive",
    header: "Status",
    render: (value: boolean, ad: Ad) => {
      const now = new Date();
      const startDate = ad.startDate ? new Date(ad.startDate) : null;
      const endDate = ad.endDate ? new Date(ad.endDate) : null;

      let status = "Draft";
      let bgColor = "bg-gray-100";
      let textColor = "text-gray-800";

      if (value) {
        if (startDate && now < startDate) {
          status = "Scheduled";
          bgColor = "bg-yellow-100";
          textColor = "text-yellow-800";
        } else if (endDate && now > endDate) {
          status = "Expired";
          bgColor = "bg-red-100";
          textColor = "text-red-800";
        } else {
          status = "Active";
          bgColor = "bg-green-100";
          textColor = "text-green-800";
        }
      }

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
    render: (value: number) => (
      <div className="flex items-center">
        <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
        <span className="text-sm font-medium">
          ${value?.toLocaleString() || "0"}
        </span>
      </div>
    ),
    sortable: true,
  },
  {
    key: "impressions",
    header: "Impressions",
    render: (value: number) => (
      <div className="text-sm text-gray-700 font-medium">
        {value?.toLocaleString() || "0"}
      </div>
    ),
    sortable: true,
  },
  {
    key: "clicks",
    header: "Clicks",
    render: (value: number, ad: Ad) => {
      const ctr = ad.impressions ? (value / ad.impressions) * 100 : 0;
      return (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {value?.toLocaleString() || "0"}
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
    render: (value: string, ad: Ad) => (
      <div className="text-sm text-gray-500">
        {value ? format(new Date(value), "MMM d") : "No start"}
        {ad.endDate && ` - ${format(new Date(ad.endDate), "MMM d")}`}
      </div>
    ),
    sortable: true,
  },
];
