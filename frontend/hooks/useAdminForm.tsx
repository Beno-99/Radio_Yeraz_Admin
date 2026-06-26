// hooks/useAdminForm.ts
import { DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createAdminSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/),
    displayName: z.string().min(2).max(100),
    password: z.string().min(6).max(100),
    confirmPassword: z.string(),
    role: z.enum(["SUPER_ADMIN", "ADMIN"]),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AdminFormValues = z.infer<typeof createAdminSchema>;

export function useAdminForm(defaultValues?: DefaultValues<AdminFormValues>) {
  return useForm<AdminFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: defaultValues || {
      username: "",
      displayName: "",
      password: "",
      confirmPassword: "",
      role: "ADMIN",
      isActive: true,
    },
  });
}
