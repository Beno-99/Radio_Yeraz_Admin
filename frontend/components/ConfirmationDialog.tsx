"use client";

import { useState, useEffect, useCallback } from "react";
import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";

export type DialogType = "delete" | "warning" | "success" | "info";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "delete",
  confirmText,
  cancelText = "Cancel",
  loading = false,
}: ConfirmationDialogProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);

    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  }, [onClose]);

  const handleConfirm = async () => {
    try {
      await onConfirm();
      handleClose();
    } catch {
      // Error handling is done in parent component
    }
  };

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const typeConfig = {
    delete: {
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      confirmColor: "bg-red-600 hover:bg-red-700",
      defaultConfirmText: "Delete",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      confirmColor: "bg-yellow-600 hover:bg-yellow-700",
      defaultConfirmText: "Confirm",
    },
    success: {
      icon: CheckCircle,
      iconColor: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      confirmColor: "bg-green-600 hover:bg-green-700",
      defaultConfirmText: "Confirm",
    },
    info: {
      icon: Info,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      confirmColor: "bg-blue-600 hover:bg-blue-700",
      defaultConfirmText: "Okay",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;
  const finalConfirmText = confirmText || config.defaultConfirmText;

  if (!isOpen && !isClosing) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
          <div
            className={`relative w-full max-w-md transform transition-all duration-200 ${
              isClosing
                ? "opacity-0 scale-95"
                : "opacity-100 scale-100"
            }`}
          >
            <div
              className={`max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-xl border shadow-2xl ${config.bgColor} ${config.borderColor}`}
            >
              {/* Header */}
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`rounded-full p-2 ${config.bgColor}`}>
                      <Icon className={`h-6 w-6 ${config.iconColor}`} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold text-gray-900">
                        {title}
                      </h3>

                      <p className="mt-1 break-words text-sm text-gray-600">
                        {message}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="min-h-11 min-w-11 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="min-h-11 rounded-lg px-4 py-2 font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
                >
                  {cancelText}
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition ${config.confirmColor} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {loading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}

                  {finalConfirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
