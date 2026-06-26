// hooks/usePostsData.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { Post } from "@/types";
import { postsAPI } from "@/lib/api/api";
import { toast } from "sonner";

const PAGE_LIMIT = 12;

export function usePostsData() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await postsAPI.getAllPosts({ limit: 1000 });
      setAllPosts(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching all posts:", error);
      setError("Failed to load posts");
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllPosts();
  }, [fetchAllPosts]);

  return {
    allPosts,
    setAllPosts,
    selectedPosts,
    setSelectedPosts,
    isDeleting,
    setIsDeleting,
    isUpdating,
    setIsUpdating,
    isLoading,
    error,
    fetchAllPosts,
  };
}

export function usePostsFilter(
  allPosts: Post[],
  filter: "all" | "published" | "draft" | "live" | "expired",
) {
  return useMemo(() => {
    if (filter === "published") {
      return allPosts.filter((p) => p.isPublished === true);
    } else if (filter === "draft") {
      return allPosts.filter((p) => p.isPublished === false);
    } else if (filter === "live") {
      return allPosts.filter((p) => p.isLive === true);
    } else if (filter === "expired") {
      return allPosts.filter((p) => p.status === "expired");
    }
    return allPosts;
  }, [allPosts, filter]);
}

export function usePostsPagination(filteredPosts: Post[], page: number) {
  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * PAGE_LIMIT;
    const end = start + PAGE_LIMIT;
    return filteredPosts.slice(start, end);
  }, [filteredPosts, page]);

  const pagination = useMemo(() => {
    const total = filteredPosts.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

    return {
      page,
      total,
      totalPages,
    };
  }, [filteredPosts, page]);

  return { paginatedPosts, pagination };
}

export function usePostsStats(allPosts: Post[]) {
  return useMemo(() => {
    return {
      livePosts: allPosts.filter((p) => p.isLive).length,
      publishedPosts: allPosts.filter((p) => p.isPublished).length,
      draftPosts: allPosts.filter((p) => p.status === "draft" || !p.isPublished)
        .length,
      postsWithMedia: allPosts.filter((p) => p.video || p.mainImage).length,
      expiredPosts: allPosts.filter((p) => p.status === "expired").length,
    };
  }, [allPosts]);
}
