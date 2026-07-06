import { Carousel } from "@/types";
import { format } from "date-fns";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import Image from "next/image";


import type { Column } from "@/components/data/DataTable";

export const CarouselColumns = (): Column<Carousel>[] => [
  {
    key: "image",
    header: "Carousel Preview",
    render: (value: unknown, carousel: Carousel) => (
      <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        {typeof value === "string" && value ? (
          <div className="relative h-full w-full">
            <Image
              src={value}
              alt={carousel.name || "Carousel image"}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <ImageIcon className="h-6 w-6 text-gray-400" />
        )}
      </div>
    ),
    width: "100px",
  },
  {
    key: "name",
    header: "Carousel",
    render: (value: unknown, carousel: Carousel) => (
      <div>
        <div className="font-medium text-gray-900 line-clamp-1">{String(value ?? "")}</div>
        <div className="text-sm text-gray-500 line-clamp-1">
          Display order: {carousel.displayOrder ?? 0}
        </div>
      </div>
    ),
    sortable: true,
  },
  {
    key: "status",
    header: "Status",
    render: (value: unknown, carousel: Carousel) => {
      const status = String(value || (carousel.isActive ? "active" : "inactive"));
      const isActive = status === "active";
      const bgColor = isActive ? "bg-green-100" : "bg-gray-100";
      const textColor = isActive ? "text-green-800" : "text-gray-800";

      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    },
    sortable: true,
  },
  {
    key: "targetUrl",
    header: "Target URL",
    render: (value: unknown) => (
      typeof value === "string" && value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-purple-600 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          <span className="line-clamp-1">{value.replace(/^https?:\/\//, "")}</span>
        </a>
      ) : (
        <span className="text-sm text-gray-400">None</span>
      )
    ),
  },
  {
    key: "startDate",
    header: "Schedule",
    render: (value: unknown, carousel: Carousel) => (
      <div className="text-sm text-gray-500">
        {typeof value === "string" && value
          ? format(new Date(value), "MMM d")
          : "No start"}
        {carousel.endDate && ` - ${format(new Date(carousel.endDate), "MMM d")}`}
      </div>
    ),
    sortable: true,
  },
];
