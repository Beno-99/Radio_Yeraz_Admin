import { Key } from "lucide-react";
import { FieldError } from "./FieldError";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { AdminFormValues } from "@/hooks/useAdminForm";

interface PasswordFieldsProps {
  register: UseFormRegister<AdminFormValues>;
  errors: FieldErrors<AdminFormValues>;
}

export function PasswordFields({ register, errors }: PasswordFieldsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
        Password
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Password <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

            <input
              {...register("password")}
              type="password"
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.password ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter password"
            />
          </div>

          <FieldError error={errors.password} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Confirm Password <span className="text-red-500">*</span>
          </label>

          <input
            {...register("confirmPassword")}
            type="password"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.confirmPassword
                ? "border-red-300"
                : "border-gray-300"
            }`}
            placeholder="Confirm password"
          />

          <FieldError error={errors.confirmPassword} />
        </div>
      </div>
    </div>
  );
}
