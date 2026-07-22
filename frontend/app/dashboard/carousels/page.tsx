
"use client";

import { useState, useEffect, useCallback } from "react";
import { CarouselsHeader } from "@/components/carousels/CarouselsHeader";
import { CarouselsStats } from "@/components/carousels/CarouselsStats";
import { CarouselsFilterBar } from "@/components/carousels/CarouselsFilterBar";
import { CarouselsGrid } from "@/components/carousels/CarouselsGrid";
import { carouselsAPI } from "@/lib/api/api";
import Swal from "sweetalert2";
import { toast } from "sonner";

const PAGE_LIMIT = 12;

const getCarouselDeleteErrorMessage = (error: unknown) => {
  const apiError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return apiError.response?.data?.message || apiError.message || "Failed to delete carousel";
};

interface Carousel {
  _id: string;
  name: string;
  image?: string;
  isActive: boolean;
  status?: "pending" | "active" | "inactive" | "expired";
  clicks: number;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
  targetUrl?: string;
  author?: {
    _id: string;
    username: string;
    displayName: string;
  };
}

export default function CarouselsPage() {
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<
    "all" | "active" | "inactive" | "pending" | "expired"
  >("all");
  const [selectedCarousels, setSelectedCarousels] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // kept because CarouselsHeader expects it
  const isUpdating = false;

  const [totalPages, setTotalPages] = useState(1);
  const [totalCarousels, setTotalCarousels] = useState(0);

  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    inactive: 0,
    pending: 0,
    expired: 0,
  });

  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "https://api.radioyeraz.com";

  const fetchCarousels = useCallback(async () => {
    try {
      const [response, activeRes, inactiveRes, pendingRes, expiredRes] =
        await Promise.all([
          carouselsAPI.getAllCarousels({
            page,
            limit: PAGE_LIMIT,
            status: filter !== "all" ? filter : undefined,
          }),
          carouselsAPI.getAllCarousels({
            page: 1,
            limit: 1,
            status: "active",
          }),
          carouselsAPI.getAllCarousels({
            page: 1,
            limit: 1,
            status: "inactive",
          }),
          carouselsAPI.getAllCarousels({
            page: 1,
            limit: 1,
            status: "pending",
          }),
          carouselsAPI.getAllCarousels({
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
        setCarousels(responseData.data || []);
        setTotalPages(responseData.pages || 1);
        setTotalCarousels(responseData.total || 0);

        setStatusCounts({
          active: activeData?.total || 0,
          inactive: inactiveData?.total || 0,
          pending: pendingData?.total || 0,
          expired: expiredData?.total || 0,
        });
      } else {
        setCarousels(Array.isArray(responseData) ? responseData : []);
      }
    } catch (error) {
      console.error("Error fetching carousels:", error);
      toast.error("Failed to load carousels");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
  const timer = setTimeout(() => {
    void fetchCarousels();
  }, 0);

  return () => clearTimeout(timer);
}, [fetchCarousels]);

  const handleBulkDelete = async () => {
    if (selectedCarousels.length === 0) return;

    const result = await Swal.fire({
      title: `Delete ${selectedCarousels.length} carousel${
        selectedCarousels.length > 1 ? "s" : ""
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
      const carouselsToDelete = [...selectedCarousels];

      setSelectedCarousels([]);

      const deleteResults = await Promise.allSettled(
        carouselsToDelete.map((id) => carouselsAPI.deleteCarousel(id))
      );

      const deletedCarouselCount = deleteResults.filter(
        (deleteResult) => deleteResult.status === "fulfilled"
      ).length;
      const failedMessages = deleteResults
        .map((deleteResult) =>
          deleteResult.status === "rejected"
            ? getCarouselDeleteErrorMessage(deleteResult.reason)
            : null
        )
        .filter((message): message is string => Boolean(message));

      if (deletedCarouselCount > 0) {
        await fetchCarousels();
      }

      if (failedMessages.length > 0) {
        if (deletedCarouselCount > 0) {
          toast.success(
            `Successfully deleted ${deletedCarouselCount} carousel(s)`
          );
        }
        toast.error(Array.from(new Set(failedMessages)).join("\n"));
        return;
      }

      toast.success(
        `Successfully deleted ${carouselsToDelete.length} carousel(s)`
      );
    } catch {
      toast.error("Failed to delete some carousels");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearSelection = () => {
    setSelectedCarousels([]);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedCarousels(selectedIds);
  };

  const handleFilterChange = (
    newFilter: "all" | "active" | "inactive" | "pending" | "expired"
  ) => {
    setFilter(newFilter);
    setPage(1);
    setSelectedCarousels([]);
  };

  return (
    <div className="space-y-8">
      <CarouselsHeader
        selectedCarousels={selectedCarousels}
        isDeleting={isDeleting}
        isUpdating={isUpdating}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
      />

      <CarouselsStats
        filter={filter}
        totalCarousels={totalCarousels}
        totalPages={totalPages}
        activeCarousels={statusCounts.active}
        inactiveCarousels={statusCounts.inactive}
        pendingCarousels={statusCounts.pending}
        expiredCarousels={statusCounts.expired}
      />

      <CarouselsFilterBar
        filter={filter}
        page={page}
        total={totalCarousels}
        totalCarousels={carousels.length}
        selectedCarousels={selectedCarousels.length}
        onFilterChange={handleFilterChange}
        onClearSelection={clearSelection}
      />

      <CarouselsGrid
        carousels={carousels}
        mediaUrl={mediaUrl}
        onCarouselDeleted={fetchCarousels}
        loading={loading}
        selectedCarousels={selectedCarousels}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
}
