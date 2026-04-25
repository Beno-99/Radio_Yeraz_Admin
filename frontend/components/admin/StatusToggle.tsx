// src/components/admin/StatusToggle.tsx
"use client";

import { useState } from "react";
import { Power, Loader2, Check, X } from "lucide-react";
import { adminAPI } from "@/lib/api/api";

interface StatusToggleProps {
  adminId: string;
  currentStatus: boolean;
  onStatusChange?: (newStatus: boolean) => void;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusToggle({
  adminId,
  currentStatus,
  onStatusChange,
  showLabel = true,
  size = "md",
}: StatusToggleProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: "h-6 w-11 text-xs",
    md: "h-7 w-14 text-sm",
    lg: "h-8 w-16 text-base",
  };

  const iconSize = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  const handleToggle = async () => {
    const newStatus = !status;
    setLoading(true);
    setError(null);

    try {
      await adminAPI.updateAdmin(adminId, { isActive: newStatus });

      setStatus(newStatus);

      if (onStatusChange) {
        onStatusChange(newStatus);
      }

      // Show success feedback
      showToast(
        `Admin ${newStatus ? "activated" : "deactivated"} successfully`,
        "success"
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update status");
      showToast("Failed to update status", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    // You can replace this with your toast system
    console.log(`${type === "success" ? "✅" : "❌"} ${message}`);
  };

  return (
    <div className="flex flex-col items-start space-y-2">
      <div className="flex items-center space-x-3">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`
            relative inline-flex items-center rounded-full transition-all duration-300
            ${sizeClasses[size]}
            ${
              status
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-300 hover:bg-gray-400"
            }
            ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
          aria-label={status ? "Deactivate admin" : "Activate admin"}
        >
          <span
            className={`
              inline-block transform rounded-full bg-white shadow-lg transition-all duration-300
              ${
                status
                  ? `translate-x-${
                      size === "sm" ? "6" : size === "md" ? "8" : "10"
                    }`
                  : "translate-x-1"
              }
              ${
                size === "sm"
                  ? "h-4 w-4"
                  : size === "md"
                  ? "h-5 w-5"
                  : "h-6 w-6"
              }
            `}
          >
            {loading ? (
              <Loader2 className="h-full w-full animate-spin text-gray-500 p-0.5" />
            ) : status ? (
              <Check className="h-full w-full text-green-500 p-0.5" />
            ) : (
              <X className="h-full w-full text-gray-400 p-0.5" />
            )}
          </span>
        </button>

        {showLabel && (
          <span className="text-sm font-medium">
            {status ? "Active" : "Inactive"}
            {loading && " (Updating...)"}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 p-2 rounded">⚠️ {error}</p>
      )}
    </div>
  );
}
