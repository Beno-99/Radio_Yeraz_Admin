import { CalendarDays, MapPin, User, ExternalLink, Globe, Clock, Eye, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Define proper types instead of any
interface Author {
  username?: string;
  displayName?: string;
  profileName?: string;
  name?: string;
}

interface Post {
  _id?: string;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  profileName?: string;
  link?: string;
  visibility?: "public" | "private";
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  author?: string | Author;
}

interface PostDetailsProps {
  post: Post;
}

export function PostDetails({ post }: PostDetailsProps) {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <TitleSection post={post} />
      <DescriptionSection description={post.description} />
      <DetailsGrid post={post} />
      <ActionButtons link={post.link} />
    </div>
  );
}

interface TitleSectionProps {
  post: Post;
}

function TitleSection({ post }: TitleSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
          {post.title}
        </h1>
        {post.visibility && (
          <span className="inline-flex items-center gap-2 self-start lg:self-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            <Globe size={14} />
            {post.visibility === "public" ? "Public" : "Private"}
          </span>
        )}
      </div>

      {post.createdAt && (
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} />
            <span>
              Created: {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>
                Updated: {new Date(post.updatedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {post.views !== undefined && (
            <div className="flex items-center gap-1.5">
              <Eye size={14} />
              <span>{post.views} views</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface DescriptionSectionProps {
  description?: string;
}

function DescriptionSection({ description }: DescriptionSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800">Description</h3>
      <p className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
        {description || (
          <span className="text-gray-400 italic">No description provided</span>
        )}
      </p>
    </div>
  );
}

interface DetailsGridProps {
  post: Post;
}

function DetailsGrid({ post }: DetailsGridProps) {
  const getAuthorName = (): string | null => {
    if (!post.author) return null;

    if (typeof post.author === "object") {
      const author = post.author as Author;
      return (
        author.username ||
        author.displayName ||
        author.profileName ||
        author.name ||
        null
      );
    }

    return null;
  };

  const authorName = getAuthorName();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-gray-200">
      {post.eventDate && (
        <DetailItem
          icon={CalendarDays}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          label="Event Date"
          value={new Date(post.eventDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        />
      )}

      {post.location && (
        <DetailItem
          icon={MapPin}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          bgColor="bg-red-50"
          label="Location"
          value={post.location}
        />
      )}

      {post.profileName && (
        <DetailItem
          icon={User}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          label="Posted By"
          value={post.profileName}
        />
      )}

      {post.link && (
        <DetailItem
          icon={ExternalLink}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          bgColor="bg-green-50"
          label="External Link"
          value={post.link.replace(/^https?:\/\//, "")}
          isLink={true}
          link={post.link}
        />
      )}
      {authorName && (
        <DetailItem
          icon={User}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          label="Author"
          value={authorName}
        />
      )}
    </div>
  );
}

// Define icon component type
type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

interface DetailItemProps {
  icon: IconComponent;
  iconBg: string;
  iconColor: string;
  bgColor: string;
  label: string;
  value: string;
  isLink?: boolean;
  link?: string;
}

function DetailItem({
  icon: Icon,
  iconBg,
  iconColor,
  bgColor,
  label,
  value,
  isLink = false,
  link = "",
}: DetailItemProps) {
  const content = isLink ? (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-blue-600 hover:text-blue-800 truncate block hover:underline"
    >
      {value}
    </a>
  ) : (
    <p className="font-medium text-gray-900">{value}</p>
  );

  return (
    <div className={`flex items-start gap-4 p-4 ${bgColor} rounded-xl`}>
      <div className={`p-2 ${iconBg} rounded-lg`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        {content}
      </div>
    </div>
  );
}

interface ActionButtonsProps {
  link?: string;
}

function ActionButtons({ link }: ActionButtonsProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-3 pt-8 border-t border-gray-200">
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ExternalLink size={16} />
          Visit Link
        </a>
      )}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Posts
      </button>
    </div>
  );
}