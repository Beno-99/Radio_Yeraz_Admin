// components/ads/AdToggleButton.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { adsAPI } from "@/lib/api/api";
import { Play, Square, Loader2 } from "lucide-react";

interface AdToggleButtonProps {
  adId: string;
  initialActive: boolean;
  onToggle?: (newStatus: boolean) => void;
}

export function AdToggleButton({
  adId,
  initialActive,
  onToggle,
}: AdToggleButtonProps) {
  const [isActive, setIsActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      // ✅ Use the toggleActive method from adsAPI
      const response = await adsAPI.toggleActive(adId);
      console.log("✅ Toggle response:", response.data);

      // Get the new status from response
      const newStatus = response.data.data?.isActive ?? !isActive;

      setIsActive(newStatus);

      if (onToggle) {
        onToggle(newStatus);
      }

      toast.success(`Ad ${newStatus ? "activated" : "deactivated"}`);
    } catch (error: any) {
      console.error("❌ Toggle error:", error);
      toast.error(error.response?.data?.message || "Failed to toggle status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-lg transition-all ${
        isActive
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      title={isActive ? "Deactivate ad" : "Activate ad"}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isActive ? (
        <Play size={18} />
      ) : (
        <Square size={18} />
      )}
    </button>
  );
}
