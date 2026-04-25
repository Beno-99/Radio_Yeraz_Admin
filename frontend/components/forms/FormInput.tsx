// components/forms/FormInput.tsx
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: keyof typeof Icons;
  error?: string;
  as?: "input" | "textarea";
};

export const FormInput = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormInputProps
>(({ label, icon, error, className, as = "input", ...props }, ref) => {
  const Icon = icon ? Icons[icon] : null;

  const commonClasses = cn(
    "w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors px-4 py-3",
    error && "border-red-300 bg-red-50",
    Icon && as === "input" && "pl-10",
    className,
  );

  if (as === "textarea") {
    const textareaProps = props as TextareaHTMLAttributes<HTMLTextAreaElement>;
    return (
      <div className="space-y-3">
        <label className="flex items-center text-sm font-medium text-gray-900">
          {Icon && <Icon className="h-4 w-4 text-gray-400 mr-2" />}
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            {...textareaProps}
            className={commonClasses}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  const inputProps = props as InputHTMLAttributes<HTMLInputElement>;
  return (
    <div className="space-y-3">
      <label className="flex items-center text-sm font-medium text-gray-900">
        {Icon && <Icon className="h-4 w-4 text-gray-400 mr-2" />}
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          {...inputProps}
          className={commonClasses}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});

FormInput.displayName = "FormInput";
