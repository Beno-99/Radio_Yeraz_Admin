import {
  CheckCircle,
  XCircle,
  CalendarDays,
  Globe,
  type LucideIcon,
} from "lucide-react";

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
  const postId = post?._id || post?.id;
  void onUpdate;

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
