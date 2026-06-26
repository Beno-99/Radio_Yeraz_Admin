"use client";

import { useState } from "react";
import { PostsHeader } from "@/components/posts/PostsHeader";
import { PostsStats } from "@/components/posts/PostStats";
import { PostsFilterBar } from "@/components/posts/PostsFilterBar";
import { PostsGrid } from "@/components/posts/PostsGrid";
import { PostPagination } from "@/components/posts/PotsPagination";
import {
  usePostsData,
  usePostsFilter,
  usePostsPagination,
  usePostsStats,
} from "../../../hooks/UsePostsData";
import { postsAPI } from "@/lib/api/api";
import Swal from "sweetalert2";


export default function PostsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<
    "all" | "published" | "draft" | "live" | "expired"
  >("all");

  // Use custom hooks
 const {
  allPosts,
  setAllPosts,
  selectedPosts,
  setSelectedPosts,
  isDeleting,
  setIsDeleting,
  isUpdating,
  isLoading,
  fetchAllPosts,
} = usePostsData();

  const filteredPosts = usePostsFilter(allPosts, filter);
  const { paginatedPosts, pagination } = usePostsPagination(
    filteredPosts,
    page,
  );
  const { livePosts, publishedPosts, draftPosts, postsWithMedia, expiredPosts } =
    usePostsStats(allPosts);

  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "http://localhost:8000";

 

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return;

    const result = await Swal.fire({
      title: `Delete ${selectedPosts.length} post${selectedPosts.length > 1 ? "s" : ""}?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete them!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      backdrop: true,
      allowOutsideClick: false,
      allowEscapeKey: true,
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      const postsToDelete = [...selectedPosts];
      setSelectedPosts([]);

      await Promise.all(
        postsToDelete.map((id) =>
          postsAPI.deletePost(id).catch((error) => {
            console.error(`Failed to delete post ${id}:`, error);
            return null;
          }),
        ),
      );

      setAllPosts((prev) =>
        prev.filter((post) => !postsToDelete.includes(post._id)),
      );

      await Swal.fire({
        title: "Success!",
        text: `Successfully deleted ${postsToDelete.length} post${postsToDelete.length > 1 ? "s" : ""}`,
        icon: "success",
        confirmButtonColor: "#10b981",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Bulk delete error:", error);
      await Swal.fire({
        title: "Error!",
        text: "Failed to delete some posts. Please try again.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedPosts([]);
  };

  // Handle selection change
  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedPosts(selectedIds);
  };

  return (
    <div className="space-y-8">
      <PostsHeader
        selectedPosts={selectedPosts}
        isDeleting={isDeleting}
        isUpdating={isUpdating}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
      />

      <PostsStats
        filter={filter}
        totalPosts={pagination.total}
        totalPages={pagination.totalPages}
        publishedPosts={publishedPosts}
        draftPosts={draftPosts}
        livePosts={livePosts}
        postsWithMedia={postsWithMedia}
        expiredPosts={expiredPosts}
      />

      <PostsFilterBar
  filter={filter}
  page={page}
  total={pagination.total}
  totalPosts={paginatedPosts.length}
  selectedPosts={selectedPosts.length}
  onFilterChange={(newFilter) => {
    setFilter(newFilter);
    setPage(1);
  }}
  onClearSelection={clearSelection}
/>

      <PostsGrid
        posts={paginatedPosts}
        mediaUrl={mediaUrl}
        onPostDeleted={fetchAllPosts}
        onSelectionChange={handleSelectionChange}
        loading={isLoading}
        selectedPosts={selectedPosts}
      />

      {pagination.totalPages > 1 && (
        <div className="flex justify-center pt-6">
          <PostPagination
            page={page}
            totalPages={pagination.totalPages}
            onChange={(newPage) => {
              setPage(newPage);
              clearSelection();
            }}
          />
        </div>
      )}
    </div>
  );
}
