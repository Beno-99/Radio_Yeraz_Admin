"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api/api";
import { DataTable } from "@/components/data/DataTable";
import {
  UserPlus,
  Shield,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
} from "lucide-react";
import type { Admin } from "@/types";
import type { Column } from "@/components/data/DataTable";
import {
  FilterPanel,
  TextFilter,
  SelectFilter,
} from "@/components/data/FilterPanel";
import { FilterChips } from "@/components/data/FilterChips";
import { toast } from "sonner";

interface AdminFilters {
  search: string;
  role: string;
  status: string | boolean | undefined;
  dateRange?: { start: string; end: string };
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function AdminPage() {
  const router = useRouter();

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);

  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });

  const [filters, setFilters] = useState<AdminFilters>({
    search: "",
    role: "all",
    status: undefined,
  });

  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  } | null>(null);

  const isSuperAdmin = useMemo(() => {
    if (typeof window === "undefined") return false;

    try {
      const userStr = localStorage.getItem("user");

      if (!userStr) return false;

      const user = JSON.parse(userStr) as { role?: string };

      return user.role === "SUPER_ADMIN";
    } catch (error) {
      console.error("Error parsing user data:", error);
      return false;
    }
  }, []);

  const fetchAdmins = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);

        const params: Record<string, string | number | boolean> = {
          page,
          limit: pagination.limit,
        };

        if (filters.search.trim()) {
          params.search = filters.search.trim();
        }

        if (filters.role !== "all") {
          params.role = filters.role;
        }

        if (filters.status !== undefined) {
          params.isActive = filters.status;
        }

        if (filters.dateRange?.start && filters.dateRange?.end) {
          params.createdAtFrom = filters.dateRange.start;
          params.createdAtTo = filters.dateRange.end;
        }

        if (sortConfig) {
          params.sortBy = sortConfig.field;
          params.sortOrder = sortConfig.direction;
        }

        const response = await adminAPI.getAllAdmins(params);

        if (response.data) {
          setAdmins(response.data.data || response.data.admins || []);

          setPagination((prev) => ({
            ...prev,
            page: response.data.page || 1,
            totalPages: response.data.totalPages || 1,
            totalItems: response.data.total || response.data.count || 0,
          }));
        }
      } catch (error: unknown) {
        console.error("Error fetching admins:", error);
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    },
    [filters, sortConfig, pagination.limit]
  );

  useEffect(() => {
    const load = async () => {
      await fetchAdmins(1);
    };

    load();
  }, [fetchAdmins]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAdmins(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [filters.search, fetchAdmins]);

  const activeFilters = [];

  if (filters.search) {
    activeFilters.push({
      key: "search",
      label: "Search",
      value: filters.search,
    });
  }

  if (filters.role !== "all") {
    activeFilters.push({
      key: "role",
      label: "Role",
      value: filters.role === "SUPER_ADMIN" ? "Super Admin" : "Admin",
    });
  }

  if (filters.status !== undefined) {
    activeFilters.push({
      key: "status",
      label: "Status",
      value: filters.status ? "Active" : "Inactive",
    });
  }

  if (filters.dateRange?.start && filters.dateRange?.end) {
    activeFilters.push({
      key: "dateRange",
      label: "Date Range",
      value: `${filters.dateRange.start} to ${filters.dateRange.end}`,
    });
  }

  const columns: Column<Admin>[] = [
    {
      key: "_id",
      header: "ID",
      render: (value: unknown) => (
        <div className="text-xs text-gray-500 truncate max-w-[120px]">
          {typeof value === "string" ? `${value.substring(0, 8)}...` : "—"}
        </div>
      ),
    },
    {
      key: "displayName",
      header: "Admin",
      render: (value: unknown, item: Admin) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-medium">
              {typeof value === "string" ? value.charAt(0).toUpperCase() : "A"}
            </span>
          </div>

          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {typeof value === "string" ? value : ""}
            </div>

            <div className="text-sm text-gray-500">
              @{item.username}
            </div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "role",
      header: "Role",
      render: (value: unknown) => {
        const role = typeof value === "string" ? value : "";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              role === "SUPER_ADMIN"
                ? "bg-green-200 text-green-800"
                : "bg-blue-200 text-blue-800"
            }`}
          >
            {role.replace("_", " ")}
          </span>
        );
      },
      sortable: true,
    },
    {
      key: "isActive",
      header: "Status",
      render: (value: unknown) => {
        const active = Boolean(value);
        return (
          <div className="flex items-center">
            <div
              className={`h-2 w-2 rounded-full mr-2 ${
                active ? "bg-green-500" : "bg-red-500"
              }`}
            />

            <span
              className={`text-sm ${
                active ? "text-green-700" : "text-red-700"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (value: unknown) => {
        if (typeof value !== "string" || !value) {
          return <div className="text-sm text-gray-500">Never</div>;
        }

        const date = new Date(value);
        const now = new Date();

        const diffDays = Math.floor(
          Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
          return <div className="text-sm text-gray-500">Today</div>;
        }

        if (diffDays === 1) {
          return <div className="text-sm text-gray-500">Yesterday</div>;
        }

        return (
          <div className="text-sm text-gray-500">
            {date.toLocaleDateString()}
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (value: unknown) => (
        <div className="text-sm text-gray-500">
          {typeof value === "string"
            ? new Date(value).toLocaleDateString()
            : "—"}
        </div>
      ),
      sortable: true,
    },
  ];

  const handleCreateAdmin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form = e.currentTarget;

    const data = {
      username: (
        form.querySelector('[name="username"]') as HTMLInputElement
      ).value,

      password: (
        form.querySelector('[name="password"]') as HTMLInputElement
      ).value,

      displayName: (
        form.querySelector('[name="displayName"]') as HTMLInputElement
      ).value,

      role: (
        form.querySelector('[name="role"]') as HTMLSelectElement
      ).value,

      isActive: (
        form.querySelector('[name="isActive"]') as HTMLInputElement
      ).checked,
    };

    try {
      await adminAPI.createAdmin(data);

      setShowForm(false);
      setShowPassword(false);

      await fetchAdmins(1);

      toast.success("Admin created successfully!");
    } catch (error: unknown) {
      const err = error as ApiError;

      toast.error(
        err.response?.data?.message || "Failed to create admin"
      );
    }
  };

  const handleEdit = (admin: Admin) => {
    router.push(`/dashboard/admin/${admin._id}/edit`);
  };

  const handleView = (adminOrId: Admin | string) => {
    const id =
      typeof adminOrId === "string" ? adminOrId : adminOrId._id;

    router.push(`/dashboard/admin/${id}`);
  };

  const handleDelete = async (admin: Admin) => {
    try {
      await adminAPI.deleteAdmin(admin._id);

      await fetchAdmins(pagination.page);

      toast.success("Admin deleted successfully!");
    } catch (error: unknown) {
      const err = error as ApiError;

      toast.error(
        err.response?.data?.message || "Failed to delete admin"
      );
    }
  };

  const handleSort = (field: string, direction: "asc" | "desc") => {
    setSortConfig({ field, direction });
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      role: "all",
      status: undefined,
      dateRange: undefined,
    });

    setSortConfig(null);
    setShowFilterPanel(false);
  };

  const removeFilter = (key: string) => {
    switch (key) {
      case "search":
        setFilters((prev) => ({ ...prev, search: "" }));
        break;

      case "role":
        setFilters((prev) => ({ ...prev, role: "all" }));
        break;

      case "status":
        setFilters((prev) => ({ ...prev, status: undefined }));
        break;

      case "dateRange":
        setFilters((prev) => ({ ...prev, dateRange: undefined }));
        break;
    }
  };

  const PaginationControls = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 space-y-3 sm:space-y-0">
      <div className="text-sm text-gray-600">
        Showing{" "}
        <span className="font-semibold">
          {(pagination.page - 1) * pagination.limit + 1}
        </span>{" "}
        to{" "}
        <span className="font-semibold">
          {Math.min(
            pagination.page * pagination.limit,
            pagination.totalItems
          )}
        </span>{" "}
        of{" "}
        <span className="font-semibold">{pagination.totalItems}</span>{" "}
        admins
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            if (pagination.page > 1) {
              const newPage = pagination.page - 1;
              setPagination((prev) => ({ ...prev, page: newPage }));
              fetchAdmins(newPage);
            }
          }}
          disabled={pagination.page === 1}
          className={`px-3 py-1 rounded-lg border ${
            pagination.page === 1
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => {
            if (pagination.page < pagination.totalPages) {
              const newPage = pagination.page + 1;
              setPagination((prev) => ({ ...prev, page: newPage }));
              fetchAdmins(newPage);
            }
          }}
          disabled={pagination.page === pagination.totalPages}
          className={`px-3 py-1 rounded-lg border ${
            pagination.page === pagination.totalPages
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Admin Management
          </h1>

          <p className="mt-1 text-gray-600">
            Manage administrator accounts and permissions
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`px-4 py-2 rounded-lg transition flex items-center ${
              showFilterPanel
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilterPanel ? "Hide Filters" : "Show Filters"}
          </button>

          <button
            onClick={() => fetchAdmins(pagination.page)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center shadow-sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin
            </button>
          )}
        </div>
      </div>

      <DataTable
        data={admins}
        columns={columns}
        loading={loading}
        pagination={{
          page: pagination.page,
          totalPages: pagination.totalPages,
          totalItems: pagination.totalItems,
          onPageChange: (page) => {
            setPagination((prev) => ({ ...prev, page }));
            fetchAdmins(page);
          },
        }}
        selection={{
          selectedIds: selectedAdmins,
          onSelectionChange: setSelectedAdmins,
        }}
        actions={{
          onView: handleView,
          onEdit: isSuperAdmin ? handleEdit : undefined,
          onDelete: isSuperAdmin ? handleDelete : undefined,
        }}
        onSort={handleSort}
      />

      {!loading && admins.length > 0 && PaginationControls}
    </div>
  );
}