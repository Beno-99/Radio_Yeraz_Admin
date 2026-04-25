// components/posts/StatCard.tsx
interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "red" | "purple" | "gray";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    gray: "bg-gray-50 border-gray-200 text-gray-700",
  } as const;

  const colorClass = colorClasses[color];
  const bgClass = colorClass.split(" ")[0];

  return (
    <div
      className={`rounded-xl border ${colorClass} p-5 flex items-center gap-4`}
    >
      <div className={`p-3 rounded-lg ${bgClass} bg-opacity-50`}>{icon}</div>
      <div>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
