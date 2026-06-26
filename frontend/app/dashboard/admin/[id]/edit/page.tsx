// app/dashboard/admin/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  User,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "@/lib/api/api";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Admin } from "@/types";
import { ConfirmationModal } from "@/components/ConfirmationModal";

// Define validation schema
const editAdminSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be at most 100 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN"]),
  isActive: z.boolean().default(true),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
});

type EditAdminFormData = z.infer<typeof editAdminSchema>;

export default function EditAdminPage() {
  const router = useRouter();
  const params = useParams();
  const adminId = params.id as string;

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Initialize form
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<EditAdminFormData>({
    resolver: zodResolver(editAdminSchema),
    defaultValues: {
      username: "",
      displayName: "",
      role: "ADMIN" as const,
      isActive: true,
      password: "",
    },
  });

  // Watch form values
const roleValue = admin?.role ?? "ADMIN";
const isActiveValue = admin?.isActive ?? false;

 

  const fetchAdminData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await adminAPI.getAdmin(adminId);

    if (response.data) {
      const adminData = response.data;
      setAdmin(adminData);

      reset({
        username: adminData.username || "",
        displayName: adminData.displayName || "",
        role: adminData.role || "ADMIN",
        isActive:
          adminData.isActive !== undefined ? adminData.isActive : true,
        password: "",
      });
    } else {
      toast.error("Admin not found");
    }

    toast.success("Admin data loaded");
  } catch (err: unknown) {
    console.error("Error fetching admin:", err);

    if (err instanceof Error) {
      toast.error(err.message);
    } else {
      toast.error("Failed to load admin data");
    }
  } finally {
    setLoading(false);
  }
}, [adminId, reset]);

 // Fetch admin data
 useEffect(() => {
  let mounted = true;

  const loadAdmin = async () => {
    if (!adminId || !mounted) return;

    await fetchAdminData();
  };

  loadAdmin();

  return () => {
    mounted = false;
  };
}, [adminId, fetchAdminData]);

  // Handle form submission
  const onSubmit = async (data: EditAdminFormData) => {
  try {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const updateData: Partial<EditAdminFormData> = {
      username: data.username,
      displayName: data.displayName,
      role: data.role,
      isActive: data.isActive,
    };

    if (data.password?.trim()) {
      updateData.password = data.password;
    }

    const response = await adminAPI.updateAdmin(adminId, updateData);
    const updatedAdmin = response.data?.data || response.data;

    if (updatedAdmin) {
      setSuccess("Admin updated successfully!");

      setAdmin(updatedAdmin);

      reset({
        username: updatedAdmin.username,
        displayName: updatedAdmin.displayName,
        role: updatedAdmin.role,
        isActive: updatedAdmin.isActive,
        password: "",
      });

      toast.success("Admin updated successfully!");
      router.push("/dashboard/admin");
    }
  } catch (err: unknown) {
    toast.error("Failed to update admin. Please try again.");

    let errorMessage = "Failed to update admin";

    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err
    ) {
      const errorResponse = err as {
        response?: {
          data?: {
            message?: string;
            errors?: Record<string, string[]>;
          };
        };
      };

      if (errorResponse.response?.data?.message) {
        errorMessage = errorResponse.response.data.message;
      } else if (errorResponse.response?.data?.errors) {
        errorMessage = Object.values(
          errorResponse.response.data.errors
        )
          .flat()
          .join(", ");
      }
    }

    setError(errorMessage);
  } finally {
    setSaving(false);
  }
};

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      if (
        confirm("You have unsaved changes. Are you sure you want to cancel?")
      ) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  const handleDelete = async () => {
    try {
      await adminAPI.deleteAdmin(adminId);
      toast.success("Admin deleted successfully");
      router.push("/dashboard/admin");
    } catch  {
      toast.error("Failed to delete admin");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error && !admin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">Error</h2>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => fetchAdminData()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Admins</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Edit Admin
              </h1>
              <p className="text-gray-600 mt-1">
                Update administrator account information
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isActiveValue
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isActiveValue ? "Active" : "Inactive"}
              </span>
             <span
  className={`px-3 py-1 rounded-full text-sm font-medium ${
    String(roleValue || admin?.role || "") === "SUPER_ADMIN"
      ? "bg-purple-100 text-purple-800"
      : "bg-blue-100 text-blue-800"
  }`}
>
  {String(roleValue || admin?.role || "ADMIN").replace("_", " ")}
</span>
            </div>
          </div>
        </div>

        {/* Admin Info Banner */}
        {admin && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {admin.displayName?.charAt(0) || "A"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {admin.displayName}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-gray-600">
                    @{admin.username}
                  </span>

                  <span className="text-sm text-gray-600">
                    • ID: {admin?._id?.substring(0, 8) || "Loading..."}...
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Last updated:{" "}
                {admin.updatedAt
                  ? new Date(admin.updatedAt).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg animate-fade-in">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg animate-fade-in">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-500">
              {/* Username */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register("username")}
                    type="text"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 text-gray-600 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.username ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter username"
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-red-600">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Display Name *
                </label>
                <input
                  {...register("displayName")}
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.displayName ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter display name"
                />
                {errors.displayName && (
                  <p className="text-sm text-red-600">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  {...register("password")}
                  type="password"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter new password (leave empty to keep current)"
                />
                <p className="text-xs text-gray-500">
                  Leave empty to keep current password
                </p>
                {errors.password && (
                  <p className="text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* Role and Status */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b">
              Permissions & Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Role *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      {...register("role")}
                      type="radio"
                      value="ADMIN"
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-700">
                      <span className="font-medium">Admin</span>
                      <p className="text-sm text-gray-500">
                        Standard administrator privileges
                      </p>
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      {...register("role")}
                      type="radio"
                      value="SUPER_ADMIN"
                      className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-gray-700">
                      <span className="font-medium">Super Admin</span>
                      <p className="text-sm text-gray-500">
                        Full system access
                      </p>
                    </span>
                  </label>
                </div>
                {errors.role && (
                  <p className="text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Account Status
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        {...register("isActive")}
                        type="checkbox"
                        className="sr-only"
                      />
                      <div
                        className={`block w-14 h-7 rounded-full transition-colors ${
                          isActiveValue ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <div
                        className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${
                          isActiveValue ? "transform translate-x-7" : ""
                        }`}
                      ></div>
                    </div>
                    <div className="ml-3">
                      <span className="font-medium text-gray-700">
                        {isActiveValue ? "Active" : "Inactive"}
                      </span>
                      <p className="text-sm text-gray-500">
                        {isActiveValue
                          ? "Admin can access the system"
                          : "Admin account is disabled"}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          {/* Danger Zone (Delete) */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-4">
              Danger Zone
            </h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-red-700">
                  Delete Admin Account
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  Once deleted, this admin account cannot be recovered.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(true);
                  // if (
                  //   confirm(
                  //     `Are you sure you want to permanently delete admin "${admin?.displayName}"? This action cannot be undone.`
                  //   ))
                  // ) {
                  //   adminAPI
                  //     .deleteAdmin(adminId)
                  //     .then(() => {
                  //       toast.success("Admin deleted successfully!");
                  //       router.push("/dashboard/admin");
                  //     })
                  //     .catch((error) => {
                  //       toast.error("Failed to delete admin: " + error.message);
                  //     });
                  // }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition whitespace-nowrap"
              >
                Delete Admin
              </button>
            </div>
          </div>
          {/* Modal */}
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            title="Delete Admin Account"
            message={`Are you sure you want to permanently delete admin "${admin?.displayName}"? This action cannot be undone.`}
            confirmText="Delete Admin"
            cancelText="Cancel"
          />
          {/* Action Buttons */}
          <div className="flex flex-col-reverse md:flex-row gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="md:flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isDirty}
              className={`md:flex-1 px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                saving || !isDirty
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
