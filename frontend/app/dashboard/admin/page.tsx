"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api/api";
import { DataTable } from "@/components/data/DataTable";
import {
  UserPlus,
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
import { getLocalStorageValue } from "@/lib/browser-storage";

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

  const isSuperAdmin = useMemo(() => {
    if (typeof window === "undefined") return false;

    try {
      const userStr = getLocalStorageValue("user");

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
          params.active = filters.status;
        }

        if (filters.dateRange?.start && filters.dateRange?.end) {
          params.createdAtFrom = filters.dateRange.start;
          params.createdAtTo = filters.dateRange.end;
        }

        const response = await adminAPI.getAllAdmins(params);

        if (response.data) {
          setAdmins(response.data.data || response.data.admins || []);

          setPagination((prev) => ({
            ...prev,
            page: response.data.page || 1,
            totalPages: response.data.totalPages || response.data.pages || 1,
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
    [filters, pagination.limit]
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

  const activeFilters: Array<{ key: string; label: string; value: string }> = [];

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
      width: "120px",
      render: (value: unknown) => (
        <div className="w-24 truncate text-xs text-gray-500">
          {typeof value === "string" ? `${value.substring(0, 8)}...` : "—"}
        </div>
      ),
    },
    {
      key: "displayName",
      header: "Admin",
      width: "280px",
      render: (value: unknown, item: Admin) => (
        <div className="flex min-w-0 items-center whitespace-nowrap">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
            <span className="text-white font-medium">
              {typeof value === "string" ? value.charAt(0).toUpperCase() : "A"}
            </span>
          </div>

          <div className="ml-3 min-w-0">
            <div className="truncate text-sm font-medium text-gray-900">
              {typeof value === "string" ? value : ""}
            </div>

            <div className="truncate text-sm text-gray-500">
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
      width: "160px",
      render: (value: unknown) => {
        const role = typeof value === "string" ? value : "";
        return (
          <span
            className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
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
      width: "140px",
      render: (value: unknown) => {
        const active = Boolean(value);
        return (
          <div className="flex items-center whitespace-nowrap">
            <div
              className={`mr-2 h-2 w-2 flex-shrink-0 rounded-full ${
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
      width: "150px",
      render: (value: unknown) => {
        if (typeof value !== "string" || !value) {
          return <div className="whitespace-nowrap text-sm text-gray-500">Never</div>;
        }

        const date = new Date(value);
        const now = new Date();

        const diffDays = Math.floor(
          Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
          return <div className="whitespace-nowrap text-sm text-gray-500">Today</div>;
        }

        if (diffDays === 1) {
          return <div className="whitespace-nowrap text-sm text-gray-500">Yesterday</div>;
        }

        return (
          <div className="whitespace-nowrap text-sm text-gray-500">
            {date.toLocaleDateString()}
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "createdAt",
      header: "Created",
      width: "150px",
      render: (value: unknown) => (
        <div className="whitespace-nowrap text-sm text-gray-500">
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

      isActive:
        (form.querySelector('[name="isActive"]') as HTMLInputElement)
          ?.checked ?? true,
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

  const handleClearFilters = () => {
    setFilters({
      search: "",
      role: "all",
      status: undefined,
      dateRange: undefined,
    });

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
    <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
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

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (pagination.page > 1) {
              const newPage = pagination.page - 1;
              setPagination((prev) => ({ ...prev, page: newPage }));
              fetchAdmins(newPage);
            }
          }}
          disabled={pagination.page === 1}
          className={`min-h-10 min-w-10 rounded-lg border px-3 py-1 ${
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
          className={`min-h-10 min-w-10 rounded-lg border px-3 py-1 ${
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
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Admin Management
          </h1>

          <p className="mt-1 text-gray-600">
            Manage administrator accounts and permissions
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex min-h-11 items-center justify-center rounded-lg px-4 py-2 transition ${
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
            className="flex min-h-11 items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin
            </button>
          )}
        </div>
      </div>

      {showFilterPanel && (
        <FilterPanel
          title="Admin Filters"
          onClear={handleClearFilters}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextFilter
              label="Search"
              value={filters.search}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, search: value }))
              }
              placeholder="Search admins..."
            />
            <SelectFilter
              label="Role"
              value={filters.role === "all" ? "" : filters.role}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, role: value || "all" }))
              }
              options={[
                { value: "SUPER_ADMIN", label: "Super Admin" },
                { value: "ADMIN", label: "Admin" },
              ]}
              placeholder="All roles"
            />
            <SelectFilter
              label="Status"
              value={
                filters.status === undefined
                  ? ""
                  : filters.status
                    ? "active"
                    : "inactive"
              }
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status:
                    value === ""
                      ? undefined
                      : value === "active",
                }))
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              placeholder="All statuses"
            />
          </div>
        </FilterPanel>
      )}

      <FilterChips
        filters={activeFilters}
        onRemove={removeFilter}
        onClearAll={handleClearFilters}
      />

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
      />

      {!loading && admins.length > 0 && PaginationControls}

      {showForm && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
          <form
            onSubmit={handleCreateAdmin}
            className="max-h-[calc(100vh-1.5rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-lg bg-white p-4 shadow-xl sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Admin
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="min-h-11 rounded-lg px-2 text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <input
              name="username"
              type="text"
              required
              minLength={3}
              placeholder="Username"
              className="min-h-11 w-full rounded border border-gray-300 px-3 py-2"
            />
            <input
              name="displayName"
              type="text"
              placeholder="Display name"
              className="min-h-11 w-full rounded border border-gray-300 px-3 py-2"
            />
            <div className="flex gap-2">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Password"
                className="min-h-11 min-w-0 flex-1 rounded border border-gray-300 px-3 py-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="min-h-11 rounded border border-gray-300 px-3 py-2 text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <select
              name="role"
              defaultValue="ADMIN"
              className="min-h-11 w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="ADMIN">Admin</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input name="isActive" type="checkbox" defaultChecked />
              Active
            </label>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="min-h-11 rounded border border-gray-300 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
