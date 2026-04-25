import { useState } from "react";
import {
  Send,
  EyeOff,
  Eye,
  CheckCircle,
  XCircle,
  CalendarDays,
  Globe,
} from "lucide-react";
import { postsAPI } from "@/lib/api/api";

interface PublishSectionProps {
  post: any;
  onUpdate: () => void;
}

export function PublishSection({ post, onUpdate }: PublishSectionProps) {
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);

  // Get the correct ID - try _id first, then id
  const postId = post?._id || post?.id;

  const handlePublish = async () => {
    if (publishing || !postId) return;

    setPublishing(true);
    try {
      // Create FormData with isLive field
      const formData = new FormData();
      formData.append("isLive", "true");

      // You might need to add all required fields
      // Check what fields your backend expects for update
      if (post.title) formData.append("title", post.title);
      if (post.description) formData.append("description", post.description);
      if (post.visibility) formData.append("visibility", post.visibility);
      // Add other fields as needed

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

      // Add other required fields
      if (post.title) formData.append("title", post.title);
      if (post.description) formData.append("description", post.description);
      if (post.visibility) formData.append("visibility", post.visibility);

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

  // Early return if no post ID
  if (!postId) {
    return (
      <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
        <p className="text-yellow-700">Cannot publish: Post ID is missing</p>
      </div>
    );
  }

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {post.isLive ? "Post is Live 🚀" : "Ready to Publish?"}
          </h2>
          <p className="text-gray-600">
            {post.isLive
              ? "Your post is visible to the public. You can unpublish it anytime."
              : "Make this post visible to your audience by publishing it."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {post.isLive ? (
            <>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to unpublish this post? It will no longer be visible to the public.",
                    )
                  ) {
                    handleUnpublish();
                  }
                }}
                disabled={unpublishing}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {unpublishing ? (
                  <>
                    <Spinner />
                    Unpublishing...
                  </>
                ) : (
                  <>
                    <EyeOff size={18} />
                    Unpublish Post
                  </>
                )}
              </button>

              <a
                href={`/posts/${postId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Eye size={18} />
                View Live
              </a>
            </>
          ) : (
            <>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? (
                  <>
                    <Spinner />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Publish Now
                  </>
                )}
              </button>

              <button
                onClick={() => alert("Saved as draft")}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CheckCircle size={18} />
                Save Draft
              </button>
            </>
          )}
        </div>
      </div>

      <StatusDetails post={post} />
    </div>
  );
}

function StatusDetails({ post }: { post: any }) {
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
  icon: any;
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
    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  );
}
