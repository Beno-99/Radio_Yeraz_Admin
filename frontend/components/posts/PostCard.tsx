import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  Pencil,
  Trash2,
  MapPin,
  Video,
  Image as ImageIcon,
  User,
  Radio,
} from "lucide-react";
import { Post } from "@/types";
import { toast } from "sonner";
import { postsAPI } from "@/lib/api/api";
import Swal from "sweetalert2";

interface PostCardProps {
  post: Post;
  mediaUrl: string;
  onDelete: () => void;
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
    } catch (error) {
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
    const eventDate = post.eventDate ? new Date(post.eventDate) : null;
    const eventExpiry =
      eventDate && !Number.isNaN(eventDate.getTime())
        ? new Date(eventDate.getTime() + 5 * 24 * 60 * 60 * 1000)
        : null;
    const expiresAt = post.expiresAt ? new Date(post.expiresAt) : null;
    const postedDate = post.postedDate ? new Date(post.postedDate) : null;

    if (eventExpiry && eventExpiry < now) return "Expired";
    if (!eventExpiry && expiresAt && expiresAt < now) return "Expired";
    if (postedDate && postedDate > now) return "Scheduled";
    if (post.isLive) return "Live";
    if (post.isPublished) return "Published";
    return "Draft";
  }, [post.eventDate, post.expiresAt, post.postedDate, post.isLive, post.isPublished]);

  const statusBadgeClass =
    postStatus === "Live"
      ? "bg-red-50 text-red-600 border-red-100"
      : postStatus === "Published"
        ? "bg-green-50 text-green-600 border-green-100"
        : postStatus === "Scheduled"
          ? "bg-blue-50 text-blue-600 border-blue-100"
          : postStatus === "Expired"
            ? "bg-gray-50 text-gray-600 border-gray-200"
            : "bg-yellow-50 text-yellow-700 border-yellow-100";

  const getMediaPreview = () => {
    if (post.video) {
      const videoUrl = post.video.startsWith("http")
        ? post.video
        : `${mediaUrl}${post.video}`;

      return (
        <div className="relative w-full h-72 bg-black rounded-t-lg overflow-hidden group/video">
          <video
            src={`${videoUrl}#t=0.1`}
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/video:opacity-100 transition-opacity"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1 uppercase tracking-wider">
            Video Preview
          </div>
        </div>
      );
    }

    if (post.mainImage) {
      const imageUrl = post.mainImage.startsWith("http")
        ? post.mainImage
        : `${mediaUrl}${post.mainImage}`;

      return (
        <div className="relative w-full h-72 bg-gray-100 rounded-t-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div className="w-full h-72 bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg flex flex-col items-center justify-center text-gray-400">
        <ImageIcon size={40} strokeWidth={1.5} className="mb-2" />
        <span className="text-xs font-medium">No Image</span>
      </div>
    );
  };

  const getAuthorName = () => {
    if (!post.author) return "Admin";

    if (typeof post.author === "object") {
      const author = post.author as any;
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-[540px] w-full max-w-[400px] mx-auto">
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
                className={`h-1.5 w-1.5 rounded-full ${
                  postStatus === "Live"
                    ? "bg-red-500 animate-pulse"
                    : postStatus === "Published"
                      ? "bg-green-500"
                      : postStatus === "Scheduled"
                        ? "bg-blue-500"
                        : postStatus === "Expired"
                          ? "bg-gray-400"
                          : "bg-yellow-500"
                }`}
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
