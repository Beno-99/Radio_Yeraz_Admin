import { useMemo } from "react";
import type { Post } from "@/types";

export function usePostStats(posts: Post[]) {
  return useMemo(() => {
    const now = new Date();

    const livePosts = posts.filter((p) => p.isLive).length;
    const postsWithMedia = posts.filter((p) => p.mainImage || p.video).length;

    const postsThisMonth = posts.filter((p) => {
      const d = new Date(p.createdAt);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;

    return {
      livePosts,
      postsWithMedia,
      postsThisMonth,
      totalPosts: posts.length,
    };
  }, [posts]);
}
