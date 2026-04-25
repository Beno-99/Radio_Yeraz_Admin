import { Target } from "lucide-react";

interface BulkActionsProps {
  count: number;
  action: string;
  onActionChange: (action: string) => void;
  onApply: () => void;
}

export default function BulkActions({
  count,
  action,
  onActionChange,
  onApply,
}: BulkActionsProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
          <Target className="h-4 w-4 text-blue-600" />
        </div>
        <span className="font-medium text-blue-900">
          {count} ad(s) selected
        </span>
      </div>
      <div className="flex items-center space-x-4">
        <select
          value={action}
          onChange={(e) => onActionChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1"
        >
          <option value="">Select action</option>
          <option value="activate">Activate Selected</option>
          <option value="deactivate">Deactivate Selected</option>
          <option value="delete">Delete Selected</option>
        </select>
        <button
          onClick={onApply}
          disabled={!action}
          className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
