import { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: {
    label: string;
    icon: keyof typeof Icons;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
  }[];
}

export default function PageHeader({
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
      </div>
      {actions && actions.length > 0 && (
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {actions.map((action, index) => {
            const Icon = Icons[action.icon] as LucideIcon;
            const variantClasses = {
              primary: "bg-blue-600 text-white hover:bg-blue-700",
              secondary: "bg-gray-600 text-white hover:bg-gray-700",
              outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
            };

            const className = `px-4 py-2 rounded-lg transition flex items-center ${
              variantClasses[action.variant || "outline"]
            }`;

            return (
              <button
                key={index}
                onClick={action.onClick}
                className={className}
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
