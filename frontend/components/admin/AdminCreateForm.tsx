"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminAPI } from "@/lib/api/api";
import { FormHeader } from "./FormHeader";
import { BasicInfoFields } from "./BasicInfoFields";
import { PasswordFields } from "./PasswordFields";
import { RoleStatusFields } from "./RoleStatusFields";
import { FormActions } from "./FormActions";
import { ErrorAlert } from "./ErrorAlert";
import { useAdminForm } from "@/hooks/useAdminForm";

interface AdminFormData {
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  role: "SUPER_ADMIN" | "ADMIN";
  isActive: boolean;
}

export function AdminCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    control,
  } = useAdminForm();

  const onSubmit = async (data: AdminFormData) => {
    setLoading(true);
    setError(null);

    try {
      const adminData = {
        username: data.username,
        displayName: data.displayName,
        password: data.password,
        role: data.role,
        isActive: data.isActive,
      };

      const response = await adminAPI.createAdmin(adminData);

      if (response.data.success) {
        toast.success("Admin created successfully!");
        router.push("/dashboard/admin");
      } else {
        setError(response.data.message || "Failed to create admin");
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err
          ? (
              err as {
                response?: {
                  data?: {
                    message?: string;
                  };
                };
              }
            ).response?.data?.message
          : undefined;

      setError(message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to cancel?",
        )
      ) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormHeader title="Create New Admin" backLink="/dashboard/admin" />

      {error && <ErrorAlert message={error} />}

      <div className="space-y-6">
        <BasicInfoFields register={register} errors={errors} />

        <PasswordFields register={register} errors={errors} />

        <RoleStatusFields
          register={register}
          watch={watch}
          control={control}
        />
      </div>

      <FormActions
        onCancel={handleCancel}
        loading={loading}
        submitText="Create Admin"
      />
    </form>
  );
}