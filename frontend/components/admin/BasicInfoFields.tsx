// components/admin/BasicInfoFields.tsx
import { User, Mail } from "lucide-react";
import { FieldError } from "./FieldError";

interface BasicInfoFieldsProps {
  register: any;
  errors: any;
}

export function BasicInfoFields({ register, errors }: BasicInfoFieldsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
        Basic Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Username <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              {...register("username")}
              type="text"
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.username ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter username"
            />
          </div>
          <FieldError error={errors.username} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register("displayName")}
            type="text"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.displayName ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Enter display name"
          />
          <FieldError error={errors.displayName} />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              {...register("email")}
              type="email"
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.email ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter email address (optional)"
            />
          </div>
          <FieldError error={errors.email} />
          <p className="text-xs text-gray-500">
            Optional but recommended for notifications
          </p>
        </div>
      </div>
    </div>
  );
}
