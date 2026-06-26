"use client";

import { useState, useEffect} from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  User,
  Shield,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import { adminAPI } from "@/lib/api/api";
import { getLocalStorageValue } from "@/lib/browser-storage";
import { format } from "date-fns";
import type { Admin } from "@/types";

export default function AdminDetailPage() {
  const router = useRouter();
  const params = useParams();

  const adminId =
    typeof params.id === "string" ? params.id : undefined;

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(Boolean(adminId));
  const [error, setError] = useState<string | null>(
    adminId ? null : "Invalid admin ID"
  );

  const isSuperAdmin =
    typeof window !== "undefined" &&
    getLocalStorageValue("user")
      ? JSON.parse(getLocalStorageValue("user") || "{}").role ===
        "SUPER_ADMIN"
      : false;

  useEffect(() => {
  if (!adminId) return;

  let isMounted = true;

  const fetchAdmin = async () => {
    try {
      const response = await adminAPI.getAdmin(adminId);

      if (!isMounted) return;

      if (response.data) {
        setAdmin(response.data);
        setError(null);
      } else {
        setError("Admin not found");
      }
    } catch (err: unknown) {
      console.error("Error fetching admin:", err);

      if (!isMounted) return;

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch admin");
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  fetchAdmin();

  return () => {
    isMounted = false;
  };
}, [adminId]);

 

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !admin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || "Admin not found"}
        </div>

        <button
          onClick={() => router.back()}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admins
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            Admin Profile
          </h1>

          <p className="text-gray-600">
            Viewing admin details
          </p>
        </div>

        {/* Admin Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-black text-2xl font-bold">
              {admin.displayName?.charAt(0) || "A"}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-600">
                {admin.displayName}
              </h2>

              <p className="text-gray-600">
                @{admin.username}
              </p>

              <div className="flex gap-2 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    admin.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {admin.isActive ? "Active" : "Inactive"}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    admin.role === "SUPER_ADMIN"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {admin.role?.replace("_", " ") || "Admin"}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Account Information
              </h3>

              <div className="flex items-center gap-3">
                {admin.isActive ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}

                <div>
                  <p className="text-sm text-gray-500">
                    Status
                  </p>

                  <p className="font-medium text-gray-600">
                    {admin.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-purple-500" />

                <div>
                  <p className="text-sm text-gray-500">
                    Role
                  </p>

                  <p className="font-medium text-gray-600">
                    {admin.role || "Administrator"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />

                <div>
                  <p className="text-sm text-gray-500">
                    Username
                  </p>

                  <p className="font-medium text-gray-600">
                    {admin.username}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Activity
              </h3>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />

                <div>
                  <p className="text-sm text-gray-500">
                    Last Login
                  </p>

                  <p className="font-medium text-gray-600">
                    {admin.lastLogin
                      ? format(
                          new Date(admin.lastLogin),
                          "MMM d, yyyy 'at' h:mm a"
                        )
                      : "Never logged in"}
                  </p>
                </div>
              </div>

              {admin.createdAt && (
                <div>
                  <p className="text-sm text-gray-500">
                    Account Created
                  </p>

                  <p className="font-medium text-gray-600">
                    {format(
                      new Date(admin.createdAt),
                      "MMMM d, yyyy"
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t">
            <button
              onClick={() => router.back()}
              className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Back to List
            </button>

            {isSuperAdmin && (
              <button
                onClick={() =>
                  router.push(
                    `/dashboard/admin/${admin._id}/edit`
                  )
                }
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
