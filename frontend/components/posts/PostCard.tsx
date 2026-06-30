import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  Pencil,
  Trash2,
  MapPin,
  Image as ImageIcon,
  User,
  Radio,
} from "lucide-react";
import { Post } from "@/types";
import { toast } from "sonner";
import { postsAPI } from "@/lib/api/api";
import { parseFacebookUrl } from "@/lib/facebook";
import {
  getEffectiveLiveStatus,
  getMediaLiveBadgeClass,
  getMediaLiveLabel,
} from "@/lib/postLiveStatus";
import { getYouTubeEmbedUrl, parseYouTubeUrl } from "@/lib/youtube";
import Swal from "sweetalert2";

interface PostCardProps {
  post: Post;
  mediaUrl: string;
  onDelete: () => void;
}

// Define the author type based on what the Post type expects
interface Author {
  username?: string;
  displayName?: string;
  profileName?: string;
  name?: string;
}

export function PostCard({ post, mediaUrl, onDelete }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const res = await Swal.fire({
      title: `Are You Sure to Delete "${post.title}" Post ?`,
      text: post.title,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });

    if (!res.isConfirmed) return;

    setIsDeleting(true);
    try {
      await postsAPI.deletePost(`${post._id}`);
      toast.success("Post deleted successfully");
      onDelete();
    } catch (err) {
      // Changed from 'error' to 'err' and added console.error to use the variable
      console.error("Delete error:", err);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const postStatus = useMemo(() => {
    const now = new Date();
    const expiresAt = post.expiresAt ? new Date(post.expiresAt) : null;
    const postedDate = post.postedDate ? new Date(post.postedDate) : null;
    const effectiveLiveStatus = getEffectiveLiveStatus(
      post.liveStatus,
      post.isLive,
    );

    if (expiresAt && expiresAt < now) return "Expired";
    if (postedDate && postedDate > now) return "Scheduled";
    if (effectiveLiveStatus === "LIVE") return "Live";
    if (effectiveLiveStatus === "UPCOMING") return "Upcoming";
    if (effectiveLiveStatus === "WAS_LIVE") return "Was Live";
    if (post.isPublished) return "Published";
    return "Draft";
  }, [
    post.expiresAt,
    post.liveStatus,
    post.postedDate,
    post.isLive,
    post.isPublished,
  ]);

  const getStatusBadgeClass = () => {
    if (postStatus === "Live") return "bg-red-50 text-red-600 border-red-100";
    if (postStatus === "Published") {
      return "bg-green-50 text-green-600 border-green-100";
    }
    if (postStatus === "Scheduled" || postStatus === "Upcoming") {
      return "bg-blue-50 text-blue-600 border-blue-100";
    }
    if (postStatus === "Expired" || postStatus === "Was Live") {
      return "bg-gray-50 text-gray-600 border-gray-200";
    }

    return "bg-yellow-50 text-yellow-700 border-yellow-100";
  };

  const statusBadgeClass = getStatusBadgeClass();

  const getStatusDotClass = () => {
    if (postStatus === "Live") return "bg-red-500 animate-pulse";
    if (postStatus === "Published") return "bg-green-500";
    if (postStatus === "Scheduled" || postStatus === "Upcoming") {
      return "bg-blue-500";
    }
    if (postStatus === "Expired" || postStatus === "Was Live") {
      return "bg-gray-400";
    }

    return "bg-yellow-500";
  };

  const getMediaPreview = () => {
    const youtubeEmbedUrl =
      (post.youtubeVideoId ? getYouTubeEmbedUrl(post.youtubeVideoId) : null) ||
      parseYouTubeUrl(post.youtubeUrl)?.embedUrl;
    const facebookEmbedUrl = parseFacebookUrl(post.facebookUrl)?.embedUrl;
    const effectiveLiveStatus = getEffectiveLiveStatus(
      post.liveStatus,
      post.isLive,
    );
    const showLiveDot = effectiveLiveStatus === "LIVE";

    if (youtubeEmbedUrl) {
      return (
        <div className="relative h-56 w-full overflow-hidden rounded-t-lg bg-black sm:h-72">
          <div className="h-full w-full">
            <iframe
              src={youtubeEmbedUrl}
              title={post.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div
            className={`absolute top-2 left-2 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1 uppercase tracking-wider ${
              getMediaLiveBadgeClass(post.liveStatus, post.isLive)
            }`}
          >
            {showLiveDot && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
            {getMediaLiveLabel("YouTube", post.liveStatus, post.isLive)}
          </div>
        </div>
      );
    }

    if (facebookEmbedUrl) {
      return (
        <div className="relative h-56 w-full overflow-hidden rounded-t-lg bg-black sm:h-72">
          <div className="h-full w-full">
            <iframe
              src={facebookEmbedUrl}
              title={post.title}
              className="h-full w-full"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div
            className={`absolute top-2 left-2 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1 uppercase tracking-wider ${
              getMediaLiveBadgeClass(
                post.liveStatus,
                post.isLive,
                "bg-blue-700/80",
              )
            }`}
          >
            {showLiveDot && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
            {getMediaLiveLabel("Facebook", post.liveStatus, post.isLive)}
          </div>
        </div>
      );
    }

    if (post.mainImage) {
      const imageUrl = post.mainImage.startsWith("http")
        ? post.mainImage
        : `${mediaUrl}${post.mainImage}`;

      return (
        <div className="relative h-56 w-full overflow-hidden rounded-t-lg bg-gray-100 sm:h-72">
          {/* Replace img with Next.js Image component */}
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div className="flex h-56 w-full flex-col items-center justify-center rounded-t-lg bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400 sm:h-72">
        <ImageIcon size={40} strokeWidth={1.5} className="mb-2" />
        <span className="text-xs font-medium">No Image</span>
      </div>
    );
  };

  // Fix: Replace 'any' with proper Author type
  const getAuthorName = () => {
    if (!post.author) return "Admin";

    if (typeof post.author === "object") {
      const author = post.author as Author;
      return (
        author.username ||
        author.displayName ||
        author.profileName ||
        author.name ||
        "Admin"
      );
    }

    return "Admin";
  };

  return (
    <div className="mx-auto flex h-full min-h-[500px] w-full max-w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md sm:min-h-[540px] sm:max-w-[400px]">
      {getMediaPreview()}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-gray-900 text-md line-clamp-2 flex-1">
            {post.title}
          </h3>

          <div className="flex-shrink-0 flex flex-col gap-1">
            <span
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border whitespace-nowrap ${statusBadgeClass}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass()}`}
              />
              {postStatus}
            </span>
          </div>
        </div>

        <p className="text-gray-500 text-sm line-clamp-3 mb-4 h-[60px]">
          {post.description || "No description"}
        </p>

        <div className="space-y-2 mb-4 bg-gray-50/50 p-3 rounded-lg">
          {post.location && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin size={14} className="flex-shrink-0 text-gray-500" />
              <span className="truncate">{post.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs">
            <Radio size={14} className="flex-shrink-0 text-gray-500" />
            <span className="text-gray-600 truncate">
              <span className="text-gray-400 mr-1">By:</span>
              <span className="font-medium text-gray-800">
                {post.profileName || "Radio Yeraz"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <User size={14} className="flex-shrink-0 text-gray-500" />
            <span className="text-gray-600 truncate">
              <span className="text-gray-400 mr-1">Author:</span>
              <span className="font-medium text-gray-800">
                {getAuthorName()}
              </span>
            </span>
          </div>

          {post.postedDate && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-gray-400 mr-1">Posted:</span>
              <span className="font-medium text-gray-800">
                {formatDate(post.postedDate)}
              </span>
            </div>
          )}

          {post.expiresAt && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-gray-400 mr-1">Expires:</span>
              <span className="font-medium text-gray-800">
                {formatDate(post.expiresAt)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
          <div className="flex gap-1">
            <Link
              href={`/dashboard/posts/${post._id}`}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="View post"
            >
              <Eye size={18} strokeWidth={1.5} />
            </Link>
            <Link
              href={`/dashboard/posts/${post._id}/edit`}
              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
              title="Edit post"
            >
              <Pencil size={18} strokeWidth={1.5} />
            </Link>
          </div>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
            title="Delete post"
          >
            <Trash2 size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
