
"use client";

import { useState, useEffect, useCallback } from "react";
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
  status?: "pending" | "active" | "inactive" | "expired";
  clicks: number;
  startDate?: string;
  endDate?: string;
  targetUrl?: string;
  author?: {
    _id: string;
    username: string;
    displayName: string;
  };
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<
    "all" | "active" | "inactive" | "pending" | "expired"
  >("all");
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // kept because AdsHeader expects it
  const isUpdating = false;

  const [totalPages, setTotalPages] = useState(1);
  const [totalAds, setTotalAds] = useState(0);

  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    inactive: 0,
    pending: 0,
    expired: 0,
  });

  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "https://api.radioyeraz.com";

  const fetchAds = useCallback(async () => {
    try {
      const [response, activeRes, inactiveRes, pendingRes, expiredRes] =
        await Promise.all([
          adsAPI.getAllAds({
            page,
            limit: PAGE_LIMIT,
            status: filter !== "all" ? filter : undefined,
          }),
          adsAPI.getAllAds({
            page: 1,
            limit: 1,
            status: "active",
          }),
          adsAPI.getAllAds({
            page: 1,
            limit: 1,
            status: "inactive",
          }),
          adsAPI.getAllAds({
            page: 1,
            limit: 1,
            status: "pending",
          }),
          adsAPI.getAllAds({
            page: 1,
            limit: 1,
            status: "expired",
          }),
        ]);

      const responseData = response.data;
      const activeData = activeRes.data;
      const inactiveData = inactiveRes.data;
      const pendingData = pendingRes.data;
      const expiredData = expiredRes.data;

      if (responseData.success) {
        setAds(responseData.data || []);
        setTotalPages(responseData.pages || 1);
        setTotalAds(responseData.total || 0);

        setStatusCounts({
          active: activeData?.total || 0,
          inactive: inactiveData?.total || 0,
          pending: pendingData?.total || 0,
          expired: expiredData?.total || 0,
        });
      } else {
        setAds(Array.isArray(responseData) ? responseData : []);
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast.error("Failed to load ads");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
  const timer = setTimeout(() => {
    void fetchAds();
  }, 0);

  return () => clearTimeout(timer);
}, [fetchAds]);

  const handleBulkDelete = async () => {
    if (selectedAds.length === 0) return;

    const result = await Swal.fire({
      title: `Delete ${selectedAds.length} ad${
        selectedAds.length > 1 ? "s" : ""
      }?`,
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

      await Promise.all(
        adsToDelete.map((id) => adsAPI.deleteAd(id))
      );

      await fetchAds();

      toast.success(
        `Successfully deleted ${adsToDelete.length} ad(s)`
      );
    } catch {
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

  const handleFilterChange = (
    newFilter: "all" | "active" | "inactive" | "pending" | "expired"
  ) => {
    setFilter(newFilter);
    setPage(1);
    setSelectedAds([]);
  };

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
        activeAds={statusCounts.active}
        inactiveAds={statusCounts.inactive}
        pendingAds={statusCounts.pending}
        expiredAds={statusCounts.expired}
      />

      <AdsFilterBar
        filter={filter}
        page={page}
        total={totalAds}
        totalAds={ads.length}
        selectedAds={selectedAds.length}
        onFilterChange={handleFilterChange}
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
