// components/forms/FormTextarea.tsx
import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: keyof typeof Icons;
  error?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, icon, error, className, ...props }, ref) => {
    const Icon = icon ? Icons[icon] : null;

    return (
      <div className="space-y-3">
        <label className="flex items-center text-sm font-medium text-gray-900">
          {Icon && <Icon className="h-4 w-4 text-gray-400 mr-2" />}
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-3">
              <Icon className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <textarea
            ref={ref}
            {...props}
            className={cn(
              "w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors px-4 py-3",
              error && "border-red-300 bg-red-50",
              Icon && "pl-10",
              className,
            )}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

FormTextarea.displayName = "FormTextarea";
