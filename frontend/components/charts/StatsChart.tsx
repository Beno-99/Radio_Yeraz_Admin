// src/components/charts/StatsChart.tsx
"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
} from "lucide-react";

interface ChartData {
  name: string;
  posts: number;
  ads: number;
  clicks: number;
  users: number;
  revenue?: number;
}
interface TooltipEntry {
  color: string;
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

export type ChartType = "line" | "bar" | "area";

interface StatsChartProps {
  data?: ChartData[];
  type?: ChartType;
  title?: string;
  height?: number;
  showLegend?: boolean;
}

export default function StatsChart({
  data: externalData,
  type = "line",
  title = "Traffic Overview",
  height = 300,
  showLegend = true,
}: StatsChartProps) {
  const [chartType, setChartType] = useState<ChartType>(type);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

  // Default data if none provided
  const defaultData: ChartData[] = [
    { name: "Mon", posts: 12, ads: 8, clicks: 240, users: 120 },
    { name: "Tue", posts: 18, ads: 10, clicks: 320, users: 180 },
    { name: "Wed", posts: 15, ads: 12, clicks: 280, users: 150 },
    { name: "Thu", posts: 22, ads: 15, clicks: 400, users: 220 },
    { name: "Fri", posts: 20, ads: 18, clicks: 380, users: 200 },
    { name: "Sat", posts: 25, ads: 20, clicks: 450, users: 250 },
    { name: "Sun", posts: 30, ads: 25, clicks: 520, users: 300 },
  ];

  const chartData = externalData || defaultData;

  // Calculate statistics
  const totalPosts = chartData.reduce((sum, item) => sum + item.posts, 0);
  const totalAds = chartData.reduce((sum, item) => sum + item.ads, 0);
  const totalClicks = chartData.reduce((sum, item) => sum + item.clicks, 0);
  const totalUsers = chartData.reduce((sum, item) => sum + item.users, 0);

  const avgPosts = Math.round(totalPosts / chartData.length);
  const avgClicks = Math.round(totalClicks / chartData.length);

  const postsTrend = chartData[chartData.length - 1].posts > chartData[0].posts;
  const clicksTrend =
    chartData[chartData.length - 1].clicks > chartData[0].clicks;

  // Custom tooltip
  const CustomTooltip = ({
  active,
  payload,
  label,
}: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry: TooltipEntry, index: number) => (
            <div key={index} className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {entry.dataKey}:
                </span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white ml-4">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render chart based on type
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Bar
              dataKey="posts"
              name="Posts"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="ads"
              name="Ads"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="clicks"
              name="Clicks"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey="posts"
              name="Posts"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorPosts)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              name="Clicks"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorClicks)"
              strokeWidth={2}
            />
          </AreaChart>
        );

      default: // line chart
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="posts"
              name="Posts"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="ads"
              name="Ads"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="clicks"
              name="Clicks"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="users"
              name="Users"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center">
              {postsTrend ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {avgPosts} avg posts/day
              </span>
            </div>
            <div className="flex items-center">
              {clicksTrend ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {avgClicks.toLocaleString()} avg clicks/day
              </span>
            </div>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(["week", "month", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                  timeRange === range
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setChartType("line")}
              className={`p-2 rounded-md transition ${
                chartType === "line"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
              title="Line Chart"
            >
              <LineChartIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`p-2 rounded-md transition ${
                chartType === "bar"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
              title="Bar Chart"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Total Posts
          </p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {totalPosts.toLocaleString()}
          </p>
          <div className="flex items-center mt-1">
            {postsTrend ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span
              className={`text-xs ${
                postsTrend ? "text-green-600" : "text-red-600"
              }`}
            >
              {postsTrend ? "+" : ""}
              {(
                (chartData[chartData.length - 1].posts / chartData[0].posts -
                  1) *
                100
              ).toFixed(1)}
              %
            </span>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Active Ads
          </p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {totalAds.toLocaleString()}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Running campaigns
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            Total Clicks
          </p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {totalClicks.toLocaleString()}
          </p>
          <div className="flex items-center mt-1">
            {clicksTrend ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span
              className={`text-xs ${
                clicksTrend ? "text-green-600" : "text-red-600"
              }`}
            >
              {clicksTrend ? "+" : ""}
              {(
                (chartData[chartData.length - 1].clicks / chartData[0].clicks -
                  1) *
                100
              ).toFixed(1)}
              %
            </span>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Total Users
          </p>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
            {totalUsers.toLocaleString()}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Active this period
          </p>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="flex flex-wrap items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Data updates in real-time • Last updated: Just now
        </div>
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
            Export Data
          </button>
          <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 font-medium">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
