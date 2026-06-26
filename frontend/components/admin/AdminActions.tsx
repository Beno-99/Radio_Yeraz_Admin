// src/components/admin/AdminActions.tsx
"use client";

import { useState } from "react";
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
} from "lucide-react";
import { StatusToggle } from "./StatusToggle";
import type { Admin } from "@/types";

interface AdminActionsProps {
  admin: Admin;
  onEdit?: (admin: Admin) => void;
  onView?: (admin: Admin) => void;
  onDelete?: (admin: Admin) => void;
  onStatusChange?: (adminId: string, newStatus: boolean) => void;
  showDropdown?: boolean;
  compact?: boolean;
}

export function AdminActions({
  admin,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
  showDropdown = true,
  compact = false,
}: AdminActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(admin);
    }
    setIsDropdownOpen(false);
  };

  const handleView = () => {
    if (onView) {
      onView(admin);
    }
    setIsDropdownOpen(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(admin);
    }
    setShowDeleteConfirm(false);
    setIsDropdownOpen(false);
  };

  const handleStatusChange = (newStatus: boolean) => {
    if (onStatusChange) {
      onStatusChange(admin._id, newStatus);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, "success");
  };

  const showToast = (message: string, type: "success" | "error") => {
    // Integrate with your toast system
    console.log(`${type === "success" ? "📋" : "❌"} ${message}`);
  };

  return (
    <div className="relative">
      {compact ? (
        // Compact view - only toggle and dropdown
        <div className="flex items-center space-x-2">
          <StatusToggle
            adminId={admin._id}
            currentStatus={admin.isActive}
            onStatusChange={handleStatusChange}
            showLabel={false}
            size="sm"
          />

          {showDropdown && (
            <>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    {onView && (
                      <button
                        onClick={handleView}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                    )}

                    {onEdit && (
                      <button
                        onClick={handleEdit}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Admin
                      </button>
                    )}

                    <button
                      onClick={() => copyToClipboard(admin._id, "Admin ID")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy ID
                    </button>

                    {onDelete && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Admin
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Full view - all buttons visible
        <div className="flex items-center space-x-2">
          <StatusToggle
            adminId={admin._id}
            currentStatus={admin.isActive}
            onStatusChange={handleStatusChange}
            size="sm"
          />

          <div className="flex space-x-1">
            {onView && (
              <button
                onClick={handleView}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}

            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-2 text-green-600 hover:bg-green-50 rounded"
                title="Edit Admin"
              >
                <Edit className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => copyToClipboard(admin._id, "Admin ID")}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              title="Copy ID"
            >
              <Copy className="h-4 w-4" />
            </button>

            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Delete Admin"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Admin
              </h3>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{admin.displayName}</span>? This
                action cannot be undone.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
