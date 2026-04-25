import { Ad } from "@/types";
import { DataTable } from "@/components/data/DataTable";
import { AdColumns } from "../../lib/utils/adColumns";
import { Play, Target, Plus } from "lucide-react";

interface AdTableProps {
  ads: Ad[];
  loading: boolean;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
  selectedAds: string[];
  onPageChange: (page: number) => void;
  onSelectChange: (ids: string[]) => void;
  onEdit: (ad: Ad) => void;
  onDelete: (ad: Ad) => void;
  onToggleStatus: (ad: Ad) => void;
  onView: (ad: Ad) => void;
  onCreateAd?: () => void; // Add this
}

export default function AdTable({
  ads,
  loading,
  pagination,
  selectedAds,
  onPageChange,
  onSelectChange,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  onCreateAd,
}: AdTableProps) {
  const columns = AdColumns();

  const customActions = [
    {
      label: "Toggle Status",
      icon: <Play className="h-4 w-4" />,
      onClick: onToggleStatus,
      variant: "success" as const,
    },
  ];

  // Create the empty state element
  const emptyStateElement = (
    <div className="text-center py-12">
      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No ad campaigns found
      </h3>
      <p className="text-gray-600 mb-6">
        Create your first ad campaign to get started
      </p>
      {onCreateAd && (
        <button
          onClick={onCreateAd}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Ad Campaign
        </button>
      )}
    </div>
  );

  return (
    <DataTable<Ad>
      data={ads}
      columns={columns}
      loading={loading}
      pagination={{
        page: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        onPageChange,
      }}
      selection={{
        selectedIds: selectedAds,
        onSelectionChange: onSelectChange,
      }}
      actions={{
        onView,
        onEdit,
        onDelete,
        customActions,
      }}
      emptyState={emptyStateElement} // Pass the element directly
    />
  );
}
