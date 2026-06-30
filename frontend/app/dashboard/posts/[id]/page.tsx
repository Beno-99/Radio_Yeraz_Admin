// app/dashboard/posts/[id]/page.tsx
"use client";

import { useState, useEffect , useCallback} from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CalendarDays,
  MapPin,
  User,
  Image as ImageIcon,
  Eye,
  Globe,
  Video,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { postsAPI } from "@/lib/api/api";
import { getYouTubeEmbedUrl, parseYouTubeUrl } from "@/lib/youtube";

interface Post {
  _id: string;
  title: string;
  description?: string;
  profileName?: string;
  location?: string;
  eventDate?: string;
  postedDate?: string;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  mainImage?: string;
  videoSource?: "YOUTUBE" | null;
  youtubeUrl?: string | null;
  youtubeVideoId?: string | null;
  isLive: boolean;
  isPublished: boolean;
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState<number>(() => Date.now());

  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "https://api.radioyeraz.com";

  // Fetch post data
  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getPost(postId);
      const postData = response.data.data;

      console.log("📥 Fetched post:", postData);
      setPost(postData);
      setImageTimestamp(Date.now()); // Force image refresh
    } catch (error: unknown) {
      console.error("Error fetching post:", error);
      const message =
  typeof error === "object" &&
  error !== null &&
  "response" in error
    ? (
        error as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      ).response?.data?.message || "Failed to load post"
    : "Failed to load post";

toast.error(message);
      router.push("/dashboard/posts");
    } finally {
      setLoading(false);
    }
  }, [postId, router]);

 useEffect(() => {
  const loadPost = async () => {
    await fetchPost();
  };

  void loadPost();
}, [fetchPost]);

  

  // Handle delete
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: `Delete "${post?.title}"?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await postsAPI.deletePost(postId);
      toast.success("Post deleted successfully");
      router.push("/dashboard/posts");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  // Toggle live status
  const handleToggleLive = async () => {
  try {
    await postsAPI.toggleLive(postId);

    setPost((prev): Post | null => {
      if (!prev) return null;

      const updatedPost: Post = {
        ...prev,
        isLive: !prev.isLive,
      };

      return updatedPost;
    });

    toast.success("Live status updated");
  } catch {
    toast.error("Failed to update live status");
  }
};

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format date with time
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get image URL with cache busting
  const getImageUrl = () => {
    if (!post?.mainImage || post.mainImage === "[object Object]" || imageError)
      return null;

    const baseUrl = post.mainImage.startsWith("http")
      ? post.mainImage
      : `${mediaUrl}${post.mainImage}`;

    return `${baseUrl}?t=${imageTimestamp}`;
  };

  const getYoutubeEmbedUrl = () => {
    if (!post) return null;

    if (post.youtubeVideoId) {
      return getYouTubeEmbedUrl(post.youtubeVideoId);
    }

    return parseYouTubeUrl(post.youtubeUrl)?.embedUrl ?? null;
  };

  const imageUrl = getImageUrl();
  const youtubeEmbedUrl = getYoutubeEmbedUrl();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading post details...</p>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Posts
        </button>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={() => {
              fetchPost();
              setImageTimestamp(Date.now());
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Live Toggle Button */}
          <button
            onClick={handleToggleLive}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              post.isLive
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Eye size={16} />
            {post.isLive ? "Live" : "Offline"}
          </button>

          {/* Edit Button */}
          <Link
            href={`/dashboard/posts/${postId}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
          >
            <Pencil size={16} />
            Edit
          </Link>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Media Section - Video or Image */}
        <div className="w-full bg-gray-100 border-b border-gray-200">
          {youtubeEmbedUrl ? (
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={youtubeEmbedUrl}
                title={post.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-full flex items-center gap-1.5">
                <Video size={16} />
                YouTube Post
              </div>
            </div>
          ) : imageUrl ? (
            <div className="relative w-full max-h-[500px] overflow-hidden">
              <Image
  src={imageUrl}
  alt={post.title}
  width={1200}
  height={800}
  className="w-full h-auto object-contain bg-gray-50"
  onError={() => setImageError(true)}
/>
              {post.isLive && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-full flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </div>
              )}
              {post.isPublished && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-full flex items-center gap-1.5">
                  <Globe size={16} />
                  Published
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              <ImageIcon size={64} className="text-gray-300" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-8">
          {/* Title and Status */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-500">ID: {post._id}</span>
              <span className="text-gray-300">•</span>
              <span
                className={`text-sm font-medium ${post.isLive ? "text-red-600" : "text-gray-500"}`}
              >
                {post.isLive ? "🔴 Live" : "⚫ Offline"}
              </span>
              <span className="text-gray-300">•</span>
              <span
                className={`text-sm font-medium ${post.isPublished ? "text-green-600" : "text-gray-500"}`}
              >
                {post.isPublished ? "✅ Published" : "📝 Draft"}
              </span>
            </div>
          </div>

          {/* Description */}
          {post.description && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Description
              </h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                {post.description}
              </p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Name */}
            {post.profileName && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Profile Name</p>
                    <p className="font-medium text-gray-900">
                      {post.profileName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            {post.location && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{post.location}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Event Date */}
            {post.eventDate && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Event Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(post.eventDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Posted Date */}
            {post.postedDate && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Posted Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(post.postedDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarDays className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expires</p>
                  <p className="font-medium text-gray-900">
                    {post.expiresAt
                      ? formatDate(post.expiresAt)
                      : "No auto expiration"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-900">
                  {formatDateTime(post.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>
                <span className="ml-2 text-gray-900">
                  {formatDateTime(post.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
