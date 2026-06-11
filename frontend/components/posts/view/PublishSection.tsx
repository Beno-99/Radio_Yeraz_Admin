import { useState } from "react";
import {
  Send,
  EyeOff,
  Eye,
  CheckCircle,
  XCircle,
  CalendarDays,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { postsAPI } from "@/lib/api/api";

interface Post {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  visibility?: "public" | "private" | string;
  isLive?: boolean;
  publishedAt?: string;
}

interface PublishSectionProps {
  post: Post;
  onUpdate: () => void;
}

export function PublishSection({
  post,
  onUpdate,
}: PublishSectionProps) {
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);

  const postId = post?._id || post?.id;

  const handlePublish = async () => {
    if (publishing || !postId) return;

    setPublishing(true);

    try {
      const formData = new FormData();

      formData.append("isLive", "true");

      if (post.title) formData.append("title", post.title);
      if (post.description)
        formData.append("description", post.description);
      if (post.visibility)
        formData.append("visibility", post.visibility);

      await postsAPI.updatePost(postId, formData);

      onUpdate();

      alert("Post published successfully!");
    } catch (error) {
      console.error("Publish error:", error);
      alert("Failed to publish post");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (unpublishing || !postId) return;

    setUnpublishing(true);

    try {
      const formData = new FormData();

      formData.append("isLive", "false");

      if (post.title) formData.append("title", post.title);
      if (post.description)
        formData.append("description", post.description);
      if (post.visibility)
        formData.append("visibility", post.visibility);

      await postsAPI.updatePost(postId, formData);

      onUpdate();

      alert("Post unpublished successfully!");
    } catch (error) {
      console.error("Unpublish error:", error);
      alert("Failed to unpublish post");
    } finally {
      setUnpublishing(false);
    }
  };

  if (!postId) {
    return (
      <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
        <p className="text-yellow-700">
          Cannot publish: Post ID is missing
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
      {/* existing JSX */}
      <StatusDetails post={post} />
    </div>
  );
}

function StatusDetails({ post }: { post: Post }) {
  return (
    <div className="mt-6 pt-6 border-t border-blue-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusItem
          icon={post.isLive ? CheckCircle : XCircle}
          label="Status"
          value={post.isLive ? "Published" : "Draft"}
          iconBg={post.isLive ? "bg-green-100" : "bg-gray-100"}
          iconColor={post.isLive ? "text-green-600" : "text-gray-600"}
        />

        {post.publishedAt && (
          <StatusItem
            icon={CalendarDays}
            label="Published On"
            value={new Date(post.publishedAt).toLocaleDateString()}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
        )}

        <StatusItem
          icon={Globe}
          label="Visibility"
          value={
            post.visibility === "public"
              ? "Public"
              : post.visibility === "private"
                ? "Private"
                : "Not Set"
          }
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>
    </div>
  );
}

function StatusItem({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
        <Icon size={20} />
      </div>

      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );
}