// components/carousels/CarouselsStats.tsx
import { Play, Square, Clock3, Layers, AlertCircle } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";

interface CarouselsStatsProps {
  filter: "all" | "active" | "inactive" | "pending" | "expired";
  totalCarousels: number;
  totalPages: number;
  activeCarousels: number;
  inactiveCarousels: number;
  pendingCarousels: number;
  expiredCarousels: number;
}

export function CarouselsStats({
  filter,
  totalCarousels,
  totalPages,
  activeCarousels,
  inactiveCarousels,
  pendingCarousels,
  expiredCarousels,
}: CarouselsStatsProps) {
  const getTitle = () => {
    switch (filter) {
      case "active":
        return "Active Carousels";
      case "inactive":
        return "Inactive Carousels";
      case "pending":
        return "Pending Carousels";
      case "expired":
        return "Expired Carousels";
      default:
        return "Total Carousels";
    }
  };

  const getSubtitle = () => {
    return filter === "all" ? `${totalPages} pages` : "Filtered total";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <StatCard
        title={getTitle()}
        value={totalCarousels}
        icon={<Layers className="w-5 h-5" />}
        color="purple"
        subtitle={getSubtitle()}
      />
      <StatCard
        title="Active"
        value={activeCarousels}
        icon={<Play className="w-5 h-5" />}
        color="green"
        subtitle={filter === "active" ? "Filtered" : "Active campaigns"}
      />
      <StatCard
        title="Inactive"
        value={inactiveCarousels}
        icon={<Square className="w-5 h-5" />}
        color="gray"
        subtitle={filter === "inactive" ? "Filtered" : "Paused"}
      />
      <StatCard
        title="Pending"
        value={pendingCarousels}
        icon={<Clock3 className="w-5 h-5" />}
        color="yellow"
        subtitle={filter === "pending" ? "Filtered" : "Waiting to start"}
      />
      <StatCard
        title="Expired"
        value={expiredCarousels}
        icon={<AlertCircle className="w-5 h-5" />}
        color="red"
        subtitle={filter === "expired" ? "Filtered" : "Ended campaigns"}
      />
    </div>
  );
}
