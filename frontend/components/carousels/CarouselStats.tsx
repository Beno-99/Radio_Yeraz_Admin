import { useMemo } from "react";
import { Carousel } from "@/types";
import {
  Target,
  DollarSign,
  Eye,
  TrendingUp,
  Smartphone,
  Monitor,
  Clock,
  Users,
} from "lucide-react";

interface CarouselStatsProps {
  carousels: Carousel[];
}

export default function CarouselStats({ carousels }: CarouselStatsProps) {
  const stats = useMemo(() => {
    const activeCarousels = carousels.filter((item) => item.isActive).length;
    const totalBudget = carousels.reduce((sum, carousel) => sum + (carousel.budget || 0), 0);
    const totalImpressions = carousels.reduce(
      (sum, carousel) => sum + (carousel.impressions || 0),
      0
    );
    const totalClicks = carousels.reduce((sum, carousel) => sum + (carousel.clicks || 0), 0);
    const overallCTR =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const mobileCarousels = carousels.filter(
      (item) => item.platform === "mobile",
    ).length;
    const webCarousels = carousels.filter(
      (item) => item.platform === "web",
    ).length;
    const scheduledCarousels = carousels.filter((item) => {
      if (!item.startDate) return false;
      const start = new Date(item.startDate);
      return item.isActive && start > new Date();
    }).length;
    const uniqueAdvertisers = new Set(
      carousels.map((item) => item.advertiserName),
    ).size;

    return {
      activeCarousels,
      totalBudget,
      totalImpressions,
      totalClicks,
      overallCTR,
      mobileCarousels,
      webCarousels,
      scheduledCarousels,
      uniqueAdvertisers,
    };
  }, [carousels]);

  const mainStats = [
    {
      title: "Active Campaigns",
      value: stats.activeCarousels,
      subtitle: `Out of ${carousels.length} total`,
      icon: Target,
      bgColor: "from-blue-50 to-blue-100",
      textColor: "text-blue-800",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Budget",
      value: `$${stats.totalBudget.toLocaleString()}`,
      subtitle: "Across all campaigns",
      icon: DollarSign,
      bgColor: "from-green-50 to-green-100",
      textColor: "text-green-800",
      iconColor: "text-green-600",
    },
    {
      title: "Total Impressions",
      value: stats.totalImpressions.toLocaleString(),
      subtitle: "Views across platforms",
      icon: Eye,
      bgColor: "from-purple-50 to-purple-100",
      textColor: "text-purple-800",
      iconColor: "text-purple-600",
    },
    {
      title: "Click-Through Rate",
      value: `${stats.overallCTR.toFixed(2)}%`,
      subtitle: `${stats.totalClicks.toLocaleString()} total clicks`,
      icon: TrendingUp,
      bgColor: "from-orange-50 to-orange-100",
      textColor: "text-orange-800",
      iconColor: "text-orange-600",
    },
  ];

  const quickStats = [
    {
      title: "Mobile Carousels",
      value: stats.mobileCarousels,
      icon: Smartphone,
      iconColor: "text-blue-500",
    },
    {
      title: "Web Carousels",
      value: stats.webCarousels,
      icon: Monitor,
      iconColor: "text-green-500",
    },
    {
      title: "Scheduled",
      value: stats.scheduledCarousels,
      icon: Clock,
      iconColor: "text-yellow-500",
    },
    {
      title: "Advertisers",
      value: stats.uniqueAdvertisers,
      icon: Users,
      iconColor: "text-purple-500",
    },
  ];

  return (
    <>
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-r ${stat.bgColor} rounded-xl p-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${stat.textColor}`}>
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold ${stat.textColor} mt-2`}>
                  {stat.value}
                </p>
                <p className={`text-sm ${stat.textColor} mt-1`}>
                  {stat.subtitle}
                </p>
              </div>
              <stat.icon className={`h-12 w-12 ${stat.iconColor} opacity-50`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex items-center">
              <stat.icon className={`h-5 w-5 ${stat.iconColor} mr-2`} />
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
