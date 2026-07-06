import { Shield } from "lucide-react";
import { Controller, UseFormRegister, UseFormWatch, Control } from "react-hook-form";
import { AdminFormValues } from "@/hooks/useAdminForm";

interface RoleStatusFieldsProps {
  register: UseFormRegister<AdminFormValues>;
  watch: UseFormWatch<AdminFormValues>;
  control: Control<AdminFormValues>;
}

export function RoleStatusFields({
  register,
  watch,
  control,
}: RoleStatusFieldsProps) {
  const watchRole = watch("role");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
        Permissions & Status
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Role <span className="text-red-500">*</span>
          </label>

          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                {...register("role")}
                type="radio"
                value="ADMIN"
                className="h-4 w-4"
              />
              <div className="ml-3">
                <span className="font-medium">Admin</span>
                <p className="text-sm text-gray-500">
                  Standard administrator privileges
                </p>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                {...register("role")}
                type="radio"
                value="SUPER_ADMIN"
                className="h-4 w-4"
              />
              <div className="ml-3">
                <span className="font-medium">Super Admin</span>
                <p className="text-sm text-gray-500">Full system access</p>
              </div>
            </label>
          </div>
        </div>

        {/* Account Status */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Account Status
          </label>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <span className="font-medium">Active Account</span>
              <p className="text-sm text-gray-500">
                User can login and access the system
              </p>
            </div>

            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    field.value ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      field.value ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              )}
            />
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="mt-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />

          <div>
            <h3 className="font-medium text-blue-800">
              Account Summary
            </h3>

            <p className="mt-1 text-sm text-blue-700">
              {watchRole === "SUPER_ADMIN"
                ? "Super Admin accounts have full system access."
                : "Admin accounts can manage content with limited system access."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
