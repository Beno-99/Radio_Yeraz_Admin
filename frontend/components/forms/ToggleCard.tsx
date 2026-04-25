// components/forms/ToggleCard.tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

// components/forms/ToggleCard.tsx
interface ToggleCardProps {
  title: string;
  description: string;
  icon: keyof typeof Icons;
  checked: boolean | undefined; // Allow undefined
  onChange: (checked: boolean) => void;
  activeContent: ReactNode;
  inactiveContent: ReactNode;
  color: "blue" | "red" | "green" | "purple";
}

export function ToggleCard({
  title,
  description,
  icon,
  checked = false, // Default to false
  onChange,
  activeContent,
  inactiveContent,
  color,
}: ToggleCardProps) {
  const Icon = Icons[icon];
  const colorClasses = {
    blue: {
      icon: "text-blue-500",
      toggle: "peer-checked:bg-blue-600 peer-focus:ring-blue-300",
      bg: "bg-blue-50",
    },
    red: {
      icon: "text-red-500",
      toggle: "peer-checked:bg-red-600 peer-focus:ring-red-300",
      bg: "bg-red-50",
    },
    green: {
      icon: "text-green-500",
      toggle: "peer-checked:bg-green-600 peer-focus:ring-green-300",
      bg: "bg-green-50",
    },
    purple: {
      icon: "text-purple-500",
      toggle: "peer-checked:bg-purple-600 peer-focus:ring-purple-300",
      bg: "bg-purple-50",
    },
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Icon className={cn("h-5 w-5 mr-3", colorClasses[color].icon)} />
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div
            className={cn(
              "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all",
              colorClasses[color].toggle,
            )}
          ></div>
        </label>
      </div>
      <div
        className={cn(
          "p-3 rounded-lg",
          checked ? colorClasses[color].bg : "bg-gray-50",
        )}
      >
        {checked ? activeContent : inactiveContent}
      </div>
    </div>
  );
}
