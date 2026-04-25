// components/posts/PostsStats.tsx
import { BarChart, Globe, Eye, Video } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";

interface PostsStatsProps {
  filter: "all" | "published" | "draft" | "live";
  totalPosts: number;
  totalPages: number;
  publishedPosts: number;
  livePosts: number;
  postsWithMedia: number;
}

export function PostsStats({
  filter,
  totalPosts,
  totalPages,
  publishedPosts,
  livePosts,
  postsWithMedia,
}: PostsStatsProps) {
  const getTitle = () => {
    switch (filter) {
      case "published":
        return "Published Posts";
      case "draft":
        return "Draft Posts";
      case "live":
        return "Live Posts";
      default:
        return "Total Posts";
    }
  };

  const getSubtitle = () => {
    return filter === "all" ? `${totalPages} pages` : "Filtered total";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title={getTitle()}
        value={totalPosts}
        icon={<BarChart className="w-5 h-5" />}
        color="blue"
        subtitle={getSubtitle()}
      />
      <StatCard
        title="Published"
        value={publishedPosts}
        icon={<Globe className="w-5 h-5" />}
        color="green"
        subtitle={filter === "published" ? "Filtered" : "On this page"}
      />
      <StatCard
        title="Live"
        value={livePosts}
        icon={<Eye className="w-5 h-5" />}
        color="red"
        subtitle={filter === "live" ? "Filtered" : "Active streams"}
      />
      <StatCard
        title="With Media"
        value={postsWithMedia}
        icon={<Video className="w-5 h-5" />}
        color="purple"
        subtitle="On this page"
      />
    </div>
  );
}
