// src/components/admin/EditAdminModal.tsx
"use client";

import { useState, useEffect } from "react";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { X, Shield, Loader2 } from "lucide-react";
import { z } from "zod";
import { adminAPI } from "@/lib/api/api";
import type { Admin } from "@/types";

// Define edit form schema (without required password)
const editAdminFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN"]),
  isActive: z.boolean(),
});

type EditAdminFormData = z.infer<typeof editAdminFormSchema>;

interface EditAdminModalProps {
  adminId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function EditAdminModal({
  adminId,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: EditAdminModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<EditAdminFormData | null>(null);

  // Form fields configuration for editing
  const formFields = [
    {
      name: "username",
      label: "Username",
      type: "text" as const,
      required: true,
      placeholder: "Enter username",
    },
    {
      name: "password",
      label: "Password",
      type: "password" as const,
      required: false,
      placeholder: "Leave empty to keep current password",
      description: "Enter new password or leave empty to keep current",
    },
    {
      name: "displayName",
      label: "Display Name",
      type: "text" as const,
      required: true,
      placeholder: "Enter display name",
    },
    {
      name: "role",
      label: "Role",
      type: "select" as const,
      required: true,
      options: [
        { value: "ADMIN", label: "Admin" },
        { value: "SUPER_ADMIN", label: "Super Admin" },
      ],
    },
    {
      name: "isActive",
      label: "Active Status",
      type: "checkbox" as const,
      description: "Enable or disable this admin account",
    },
  ];

  // Fetch admin data when modal opens
  useEffect(() => {
    if (isOpen && adminId) {
      fetchAdminData();
    }
  }, [isOpen, adminId]);

  const fetchAdminData = async () => {
    try {
      setFetching(true);
      const response = await adminAPI.getAdmin(adminId);

      if (response.data) {
        const adminData = response.data;
        setAdmin(adminData);

        // Prepare form data
        setFormData({
          username: adminData.username || "",
          password: "", // Empty password field for editing
          displayName: adminData.displayName || "",
          role: adminData.role || "ADMIN",
          isActive:
            adminData.isActive !== undefined ? adminData.isActive : true,
        });
      }
    } catch (error: any) {
      console.error("Error fetching admin:", error);
      if (onError) {
        onError(error.response?.data?.message || "Failed to fetch admin data");
      }
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (data: EditAdminFormData) => {
    try {
      setLoading(true);

      // Prepare update data (remove empty password)
      const updateData: any = {
        username: data.username,
        displayName: data.displayName,
        role: data.role,
        isActive: data.isActive,
      };

      // Only include password if provided
      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      console.log("Updating admin with data:", updateData);

      const response = await adminAPI.updateAdmin(adminId, updateData);

      if (response.data) {
        // Show success message
        if (onSuccess) {
          onSuccess();
        }

        // Close modal
        onClose();

        // Optional: Show toast notification
        showNotification("Admin updated successfully", "success");
      }
    } catch (error: any) {
      console.error("Error updating admin:", error);

      // Handle specific errors
      let errorMessage = "Failed to update admin";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join(", ");
      }

      if (onError) {
        onError(errorMessage);
      }

      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    // You can integrate with your notification system (like react-hot-toast)
    // For now, using alert or console
    if (type === "success") {
      alert(`✅ ${message}`);
    } else {
      alert(`❌ ${message}`);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAdmin(null);
      setFormData(null);
      setFetching(true);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-3">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Admin</h2>
              <p className="text-sm text-gray-600">
                Update admin account information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Loading state */}
        {fetching ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-600">Loading admin data...</p>
          </div>
        ) : !formData ? (
          <div className="p-12 text-center">
            <p className="text-red-600 mb-4">Failed to load admin data</p>
            <button
              onClick={fetchAdminData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Form */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <FormBuilder
                fields={formFields}
                onSubmit={(data) => handleSubmit(data as EditAdminFormData)}
                onCancel={onClose}
                schema={editAdminFormSchema}
                submitText={loading ? "Updating..." : "Update Admin"}
                cancelText="Cancel"
                defaultValues={formData}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// CSS animation
const style = document.createElement("style");
style.innerHTML = `
  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .animate-scale-in {
    animation: scale-in 0.2s ease-out;
  }
`;
document.head.appendChild(style);
