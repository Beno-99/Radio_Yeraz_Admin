// hooks/useAdminForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createAdminSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email().optional().or(z.literal("")),
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

export function useAdminForm(defaultValues?: any) {
  return useForm({
    resolver: zodResolver(createAdminSchema),
    defaultValues: defaultValues || {
      username: "",
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
      role: "ADMIN",
      isActive: true,
    },
  });
}
