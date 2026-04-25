// components/ads/AdsStats.tsx
import {
  BarChart,
  Play,
  Square,
  MousePointerClick,
  Layers,
} from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";

interface AdsStatsProps {
  filter: "all" | "active" | "inactive";
  totalAds: number;
  totalPages: number;
  activeAds: number;
  inactiveAds: number;
  totalClicks: number;
}

export function AdsStats({
  filter,
  totalAds,
  totalPages,
  activeAds,
  inactiveAds,
  totalClicks,
}: AdsStatsProps) {
  const getTitle = () => {
    switch (filter) {
      case "active":
        return "Active Ads";
      case "inactive":
        return "Inactive Ads";
      default:
        return "Total Ads";
    }
  };

  const getSubtitle = () => {
    return filter === "all" ? `${totalPages} pages` : "Filtered total";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        title="Total Clicks"
        value={totalClicks}
        icon={<MousePointerClick className="w-5 h-5" />}
        color="blue"
        subtitle="All time"
      />
    </div>
  );
}
