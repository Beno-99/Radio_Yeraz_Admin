// app/dashboard/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { adminAPI, postsAPI, adsAPI } from "@/lib/api/api";
import StatsCards from "@/components/dashboard/StatsCards";
import {
  Users,
  PlusCircle,
  Upload,
  BarChart3,
  Settings,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalPosts: 0,
    totalAds: 0,
    activePosts: 0,
    clicksToday: 0,
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    // Prevent double fetching in strict mode
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    // Force stop loading after 5 seconds no matter what
    const forceStopLoading = setTimeout(() => {
      setLoading(false);
      setError("Request timed out. Please check if backend is running.");
    }, 5000);

    fetchDashboardData();

    return () => clearTimeout(forceStopLoading);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📡 Fetching dashboard data...");

      // Simple fetch with no complex timeout logic
      let adminsTotal = 0;
      let postsTotal = 0;
      let adsTotal = 0;
      let activePosts = 0;
      let clicksToday = 0;

      try {
        const adminsRes = await adminAPI.getAllAdmins({ limit: 1 });
        adminsTotal = adminsRes.data?.total || 0;
        console.log("✅ Admins:", adminsTotal);
      } catch (e) {
        console.error("❌ Admins error:", e);
      }

      try {
        const postsRes = await postsAPI.getAllPosts({ limit: 1 });
        postsTotal = postsRes.data?.total || 0;
        const posts = postsRes.data?.data || [];
        activePosts = posts.filter((p: any) => p.isLive).length;
        console.log("✅ Posts:", postsTotal);
      } catch (e) {
        console.error("❌ Posts error:", e);
      }

      try {
        const adsRes = await adsAPI.getAllAds({ limit: 1 });
        adsTotal = adsRes.data?.total || 0;
        const ads = adsRes.data?.data || [];
        clicksToday = ads.reduce(
          (sum: number, ad: any) => sum + (ad.clicks || 0),
          0,
        );
        console.log("✅ Ads:", adsTotal);
      } catch (e) {
        console.error("❌ Ads error:", e);
      }

      setStats({
        totalAdmins: adminsTotal,
        totalPosts: postsTotal,
        totalAds: adsTotal,
        activePosts: activePosts,
        clicksToday: clicksToday,
        upcomingEvents: 3,
      });

      console.log("✅ Dashboard data loaded");
    } catch (error) {
      console.error("❌ Fatal error:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Create New Post",
      description: "Publish new content",
      icon: PlusCircle,
      color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
      path: "/dashboard/posts/create",
    },
    {
      title: "Upload Ad",
      description: "Start new campaign",
      icon: Upload,
      color: "bg-green-50 text-green-700 hover:bg-green-100",
      path: "/dashboard/ads/create",
    },
    {
      title: "Manage Users",
      description: "Admin management",
      icon: Users,
      color: "bg-orange-50 text-orange-700 hover:bg-orange-100",
      path: "/dashboard/admin",
    },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          <p className="mt-2 text-sm text-gray-400">
            If this takes too long, check if backend is running
          </p>
          <button
            onClick={() => {
              setLoading(false);
              setError("Loading cancelled");
            }}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel Loading
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center max-w-md p-8 bg-red-50 rounded-xl">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-2">
            <button
              onClick={() => {
                fetchAttempted.current = false;
                fetchDashboardData();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show dashboard
  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => {
              fetchAttempted.current = false;
              fetchDashboardData();
            }}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center text-sm sm:text-base"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Refresh Dashboard
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Platform Overview
          </h2>
          <button
            onClick={() => {
              fetchAttempted.current = false;
              fetchDashboardData();
            }}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center self-start sm:self-auto"
          >
            Refresh Data
            <ArrowRight className="h-3 w-3 ml-1" />
          </button>
        </div>
        <StatsCards stats={stats} isLoading={false} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 text-center sm:text-left">
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.path}
                className={`${action.color} p-4 sm:p-6 rounded-xl transition hover:shadow-lg flex flex-col items-center text-center group`}
              >
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 mb-2 sm:mb-3" />
                <h4 className="font-medium text-sm sm:text-base mb-1">
                  {action.title}
                </h4>
                <p className="text-xs sm:text-sm opacity-80">
                  {action.description}
                </p>
                <ArrowRight className="h-4 w-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
