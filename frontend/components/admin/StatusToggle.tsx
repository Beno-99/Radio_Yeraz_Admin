"use client";

import { useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { adminAPI } from "@/lib/api/api";

interface StatusToggleProps {
  adminId: string;
  currentStatus: boolean;
  onStatusChange?: (newStatus: boolean) => void;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
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

  const handleToggle = async () => {
    const newStatus = !status;
    setLoading(true);
    setError(null);

    try {
      await adminAPI.updateAdmin(adminId, {
        isActive: newStatus,
      });

      setStatus(newStatus);

      onStatusChange?.(newStatus);

      showToast(
        `Admin ${newStatus ? "activated" : "deactivated"} successfully`,
        "success",
      );
    } catch (err: unknown) {
      const error = err as ApiError;

      setError(
        error.response?.data?.message ||
          "Failed to update status",
      );

      showToast("Failed to update status", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error",
  ) => {
    // Replace with real toast system if needed
    console.log(
      `${type === "success" ? "✅" : "❌"} ${message}`,
    );
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
            ${
              loading
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }
          `}
          aria-label={
            status ? "Deactivate admin" : "Activate admin"
          }
        >
          <span
            className={`
              inline-block transform rounded-full bg-white shadow-lg transition-all duration-300
              ${
                status
                  ? size === "sm"
                    ? "translate-x-6"
                    : size === "md"
                      ? "translate-x-8"
                      : "translate-x-10"
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
              <Loader2 className="h-full w-full animate-spin p-0.5 text-gray-500" />
            ) : status ? (
              <Check className="h-full w-full p-0.5 text-green-500" />
            ) : (
              <X className="h-full w-full p-0.5 text-gray-400" />
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
        <p className="rounded bg-red-50 p-2 text-xs text-red-600">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}