// app/dashboard/ads/page.tsx
"use client";

import { useState, useEffect } from "react";
import { AdsHeader } from "@/components/ads/AdsHeader";
import { AdsStats } from "@/components/ads/AdsStats";
import { AdsFilterBar } from "@/components/ads/AdsFilterBar";
import { AdsGrid } from "@/components/ads/AdsGrid";
import { adsAPI } from "@/lib/api/api";
import Swal from "sweetalert2";
import { toast } from "sonner";

const PAGE_LIMIT = 12;

interface Ad {
  _id: string;
  name: string;
  image?: string;
  isActive: boolean;
  clicks: number;
  startDate?: string;
  endDate?: string;
  targetUrl?: string;
  author?: {
    // ← update this
    _id: string;
    username: string;
    displayName: string;
  };
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAds, setTotalAds] = useState(0);

  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "http://localhost:8000";

  const fetchAds = async () => {
    try {
      const response = await adsAPI.getAllAds({
        page,
        limit: PAGE_LIMIT,
        isActive: filter !== "all" ? filter === "active" : undefined,
      });

      const responseData = response.data;

      if (responseData.success) {
        setAds(responseData.data || []);
        setTotalPages(responseData.pages || 1);
        setTotalAds(responseData.total || 0);
      } else {
        setAds(Array.isArray(responseData) ? responseData : []);
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast.error("Failed to load ads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [page, filter]);

  useEffect(() => {
    setPage(1);
    setSelectedAds([]);
  }, [filter]);

  const handleBulkDelete = async () => {
    if (selectedAds.length === 0) return;

    const result = await Swal.fire({
      title: `Delete ${selectedAds.length} ad${selectedAds.length > 1 ? "s" : ""}?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete them!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      const adsToDelete = [...selectedAds];
      setSelectedAds([]);

      await Promise.all(adsToDelete.map((id) => adsAPI.deleteAd(id)));

      await fetchAds();
      toast.success(`Successfully deleted ${adsToDelete.length} ad(s)`);
    } catch (error) {
      toast.error("Failed to delete some ads");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearSelection = () => {
    setSelectedAds([]);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedAds(selectedIds);
  };

  // Calculate stats
  const activeAds = ads.filter((ad) => ad.isActive).length;
  const inactiveAds = ads.filter((ad) => !ad.isActive).length;
  const totalClicks = ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0);

  return (
    <div className="space-y-8">
      <AdsHeader
        selectedAds={selectedAds}
        isDeleting={isDeleting}
        isUpdating={isUpdating}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
      />

      <AdsStats
        filter={filter}
        totalAds={totalAds}
        totalPages={totalPages}
        activeAds={activeAds}
        inactiveAds={inactiveAds}
        totalClicks={totalClicks}
      />

      <AdsFilterBar
        filter={filter}
        page={page}
        total={totalAds}
        totalAds={ads.length}
        selectedAds={selectedAds.length}
        onFilterChange={setFilter}
        onClearSelection={clearSelection}
      />

      <AdsGrid
        ads={ads}
        mediaUrl={mediaUrl}
        onAdDeleted={fetchAds}
        loading={loading}
        selectedAds={selectedAds}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
}
