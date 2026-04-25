"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function AdminPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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

  const [toggleDialog, setToggleDialog] = useState<{
    isOpen: boolean;
    admin: Admin | null;
  }>({ isOpen: false, admin: null });

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setIsSuperAdmin(user.role === "SUPER_ADMIN");
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  const fetchAdmins = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params: any = { page, limit: pagination.limit };

        if (filters.search.trim()) params.search = filters.search.trim();
        if (filters.role !== "all") params.role = filters.role;
        if (filters.status !== undefined) params.isActive = filters.status;
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
      } catch (error) {
        console.error("Error fetching admins:", error);
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    },
    [filters, sortConfig, pagination.limit],
  );

  useEffect(() => {
    fetchAdmins(1);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchAdmins(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search, fetchAdmins]);

  const activeFilters = [];
  if (filters.search)
    activeFilters.push({
      key: "search",
      label: "Search",
      value: filters.search,
    });
  if (filters.role !== "all")
    activeFilters.push({
      key: "role",
      label: "Role",
      value: filters.role === "SUPER_ADMIN" ? "Super Admin" : "Admin",
    });
  if (filters.status !== undefined)
    activeFilters.push({
      key: "status",
      label: "Status",
      value: filters.status ? "Active" : "Inactive",
    });
  if (filters.dateRange?.start && filters.dateRange?.end)
    activeFilters.push({
      key: "dateRange",
      label: "Date Range",
      value: `${filters.dateRange.start} to ${filters.dateRange.end}`,
    });

  const columns = [
    {
      key: "_id",
      header: "ID",
      render: (value: string) => (
        <div className="text-xs text-gray-500 truncate max-w-[120px]">
          {value.substring(0, 8)}...
        </div>
      ),
    },
    {
      key: "displayName",
      header: "Admin",
      render: (value: string, item: Admin) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-medium">
              {value?.charAt(0).toUpperCase() || "A"}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">@{item.username}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "role",
      header: "Role",
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${value === "SUPER_ADMIN" ? "bg-green-200 text-green-800" : "bg-blue-200 text-blue-800"}`}
        >
          {value.replace("_", " ")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "isActive",
      header: "Status",
      render: (value: boolean) => (
        <div className="flex items-center">
          <div
            className={`h-2 w-2 rounded-full mr-2 ${value ? "bg-green-500" : "bg-red-500"}`}
          />
          <span
            className={`text-sm ${value ? "text-green-700" : "text-red-700"}`}
          >
            {value ? "Active" : "Inactive"}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (value?: string) => {
        if (!value) return <div className="text-sm text-gray-500">Never</div>;
        const date = new Date(value);
        const now = new Date();
        const diffDays = Math.floor(
          Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diffDays === 0)
          return <div className="text-sm text-gray-500">Today</div>;
        if (diffDays === 1)
          return <div className="text-sm text-gray-500">Yesterday</div>;
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
      render: (value: string) => (
        <div className="text-sm text-gray-500">
          {new Date(value).toLocaleDateString()}
        </div>
      ),
      sortable: true,
    },
  ];

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      username: (form.querySelector('[name="username"]') as HTMLInputElement)
        .value,
      password: (form.querySelector('[name="password"]') as HTMLInputElement)
        .value,
      displayName: (
        form.querySelector('[name="displayName"]') as HTMLInputElement
      ).value,
      role: (form.querySelector('[name="role"]') as HTMLSelectElement).value,
      isActive: (form.querySelector('[name="isActive"]') as HTMLInputElement)
        .checked,
    };

    try {
      await adminAPI.createAdmin(data);
      setShowForm(false);
      setShowPassword(false);
      fetchAdmins(1);
      toast.success("Admin created successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create admin");
    }
  };

  const handleEdit = (admin: Admin) => {
    router.push(`/dashboard/admin/${admin._id}/edit`);
  };

  const handleView = (adminOrId: Admin | string) => {
    const id = typeof adminOrId === "string" ? adminOrId : adminOrId._id;
    router.push(`/dashboard/admin/${id}`);
  };

  const handleDelete = async (admin: Admin) => {
    try {
      await adminAPI.deleteAdmin(admin._id);
      fetchAdmins(pagination.page);
      toast.success("Admin deleted successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete admin");
    }
  };

  const handleSort = (field: string, direction: "asc" | "desc") => {
    setSortConfig({ field, direction });
    fetchAdmins(1);
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
    fetchAdmins(1);
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
          {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
        </span>{" "}
        of <span className="font-semibold">{pagination.totalItems}</span> admins
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            if (pagination.page > 1) {
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
              fetchAdmins(pagination.page - 1);
            }
          }}
          disabled={pagination.page === 1}
          className={`px-3 py-1 rounded-lg border ${pagination.page === 1 ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center space-x-1">
          {Array.from(
            { length: Math.min(5, pagination.totalPages) },
            (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) pageNum = i + 1;
              else if (pagination.page <= 3) pageNum = i + 1;
              else if (pagination.page >= pagination.totalPages - 2)
                pageNum = pagination.totalPages - 4 + i;
              else pageNum = pagination.page - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    setPagination((prev) => ({ ...prev, page: pageNum }));
                    fetchAdmins(pageNum);
                  }}
                  className={`px-3 py-1 rounded-lg ${pagination.page === pageNum ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
                >
                  {pageNum}
                </button>
              );
            },
          )}
        </div>
        <button
          onClick={() => {
            if (pagination.page < pagination.totalPages) {
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
              fetchAdmins(pagination.page + 1);
            }
          }}
          disabled={pagination.page === pagination.totalPages}
          className={`px-3 py-1 rounded-lg border ${pagination.page === pagination.totalPages ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
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
            className={`px-4 py-2 rounded-lg transition flex items-center ${showFilterPanel ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
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

      {/* Filter Chips */}
      {activeFilters.length > 0 && (
        <FilterChips
          filters={activeFilters}
          onRemove={removeFilter}
          onClearAll={handleClearFilters}
        />
      )}

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="mb-6">
          <FilterPanel
            title="Filter Admins"
            onClear={handleClearFilters}
            showClearButton={activeFilters.length > 0}
            defaultExpanded={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-gray-500">
              <TextFilter
                label="Search"
                value={filters.search}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, search: value }))
                }
                placeholder="Search by name or username..."
              />
              <SelectFilter
                label="Role"
                value={filters.role}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, role: value }))
                }
                options={[
                  { value: "all", label: "All Roles" },
                  { value: "SUPER_ADMIN", label: "Super Admin" },
                  { value: "ADMIN", label: "Admin" },
                ]}
              />
            </div>
          </FilterPanel>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => {
                setShowFilterPanel(false);
                fetchAdmins(1);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Create New Admin
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setShowPassword(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  name="username"
                  type="text"
                  required
                  placeholder="Enter username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter password"
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  name="displayName"
                  type="text"
                  required
                  placeholder="Enter display name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  name="role"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-700"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked
                  id="isActive"
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Active Status
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setShowPassword(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Table */}
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
          customActions: isSuperAdmin
            ? [
                {
                  label: "Toggle Status",
                  icon: <Shield className="h-4 w-4" />,
                  onClick: (admin) => setToggleDialog({ isOpen: true, admin }),
                  variant: "success",
                },
              ]
            : [],
        }}
        onSort={handleSort}
        emptyState={
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {loading ? "Loading admins..." : "No admins found"}
            </h3>
            <p className="text-gray-600 mb-6">
              {loading
                ? "Please wait..."
                : activeFilters.length > 0
                  ? "Try changing your filters"
                  : "Create your first admin"}
            </p>
            {!loading && isSuperAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin
              </button>
            )}
          </div>
        }
      />

      {/* Pagination */}
      {!loading && admins.length > 0 && PaginationControls}
    </div>
  );
}
