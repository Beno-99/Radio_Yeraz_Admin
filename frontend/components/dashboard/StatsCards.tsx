// src/components/dashboard/StatsCards.tsx
"use client";

import {
  Users,
  FileText,
  Megaphone,
} from "lucide-react";

export interface StatCard {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  description?: string;
}

interface StatsCardsProps {
  stats?: {
    totalAdmins?: number;
    totalPosts?: number;
    totalCarousels?: number;
    activePosts?: number;
    clicksToday?: number;
    upcomingEvents?: number;
  };
  isLoading?: boolean;
}

export default function StatsCards({
  stats,
  isLoading = false,
}: StatsCardsProps) {
  const defaultStats = {
    totalAdmins: stats?.totalAdmins || 0,
    totalPosts: stats?.totalPosts || 0,
    totalCarousels: stats?.totalCarousels || 0,
    activePosts: stats?.activePosts || 0,
    clicksToday: stats?.clicksToday || 0,
    upcomingEvents: stats?.upcomingEvents || 0,
  };

  const statCards: StatCard[] = [
    {
      title: "Total Admins",
      value: defaultStats.totalAdmins.toLocaleString(),
      icon: Users,
      color: "bg-blue-500",
      trend: {
        value: 12,
        isPositive: true,
        label: "From last month",
      },
      description: "Active administrator accounts",
    },
    {
      title: "Total Posts",
      value: defaultStats.totalPosts.toLocaleString(),
      icon: FileText,
      color: "bg-green-500",
      trend: {
        value: 24,
        isPositive: true,
        label: "From last week",
      },
      description: "Published content",
    },
    {
      title: "Active Carousels",
      value: defaultStats.totalCarousels.toLocaleString(),
      icon: Megaphone,
      color: "bg-purple-500",
      trend: {
        value: 8,
        isPositive: false,
        label: "From yesterday",
      },
      description: "Currently running campaigns",
    },

    // {
    //   title: "Active Posts",
    //   value: defaultStats.activePosts.toLocaleString(),
    //   icon: Eye,
    //   color: "bg-indigo-500",
    //   trend: {
    //     value: 5,
    //     isPositive: true,
    //     label: "Currently live",
    //   },
    //   description: "Posts visible to users",
    // },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  {card.description && (
                    <p className="text-xs text-gray-400 mt-1">
                      {card.description}
                    </p>
                  )}
                </div>
                <div className={`${card.color} p-3 rounded-xl`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  {card.trend && (
                    <div className="flex items-center mt-2">
                      <span
                        className={`text-sm font-medium ${
                          card.trend.isPositive
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {card.trend.isPositive ? "+" : ""}
                        {card.trend.value}%
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {card.trend.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar (optional) */}
              {card.trend && (
                <div className="mt-4">
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        card.trend.isPositive ? "bg-green-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(card.trend.value, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
