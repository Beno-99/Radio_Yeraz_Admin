// components/ConfirmationDialog.tsx
"use client";

import { useState, useEffect } from "react";
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      handleClose();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  // Configuration based on dialog type
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

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className={`relative w-full max-w-md transform transition-all ${
              isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
          >
            <div
              className={`rounded-xl shadow-2xl overflow-hidden ${config.bgColor} ${config.borderColor} border`}
            >
              {/* Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${config.bgColor}`}>
                      <Icon className={`h-6 w-6 ${config.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{message}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`px-4 py-2 text-white rounded-lg font-medium transition ${config.confirmColor} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  {loading && (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
