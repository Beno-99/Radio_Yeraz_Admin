// components/ads/AdsStats.tsx
import { Play, Square, Clock3, Layers, AlertCircle } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";

interface AdsStatsProps {
  filter: "all" | "active" | "inactive" | "pending" | "expired";
  totalAds: number;
  totalPages: number;
  activeAds: number;
  inactiveAds: number;
  pendingAds: number;
  expiredAds: number;
}

export function AdsStats({
  filter,
  totalAds,
  totalPages,
  activeAds,
  inactiveAds,
  pendingAds,
  expiredAds,
}: AdsStatsProps) {
  const getTitle = () => {
    switch (filter) {
      case "active":
        return "Active Ads";
      case "inactive":
        return "Inactive Ads";
      case "pending":
        return "Pending Ads";
      case "expired":
        return "Expired Ads";
      default:
        return "Total Ads";
    }
  };

  const getSubtitle = () => {
    return filter === "all" ? `${totalPages} pages` : "Filtered total";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <StatCard
        title={getTitle()}
        value={totalAds}
        icon={<Layers className="w-5 h-5" />}
        color="purple"
        subtitle={getSubtitle()}
      />
      <StatCard
        title="Active"
        value={activeAds}
        icon={<Play className="w-5 h-5" />}
        color="green"
        subtitle={filter === "active" ? "Filtered" : "Active campaigns"}
      />
      <StatCard
        title="Inactive"
        value={inactiveAds}
        icon={<Square className="w-5 h-5" />}
        color="gray"
        subtitle={filter === "inactive" ? "Filtered" : "Paused"}
      />
      <StatCard
        title="Pending"
        value={pendingAds}
        icon={<Clock3 className="w-5 h-5" />}
        color="yellow"
        subtitle={filter === "pending" ? "Filtered" : "Waiting to start"}
      />
      <StatCard
        title="Expired"
        value={expiredAds}
        icon={<AlertCircle className="w-5 h-5" />}
        color="red"
        subtitle={filter === "expired" ? "Filtered" : "Ended campaigns"}
      />
    </div>
  );
}