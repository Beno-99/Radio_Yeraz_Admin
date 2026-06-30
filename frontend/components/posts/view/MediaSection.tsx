// components/forms/MediaSection.tsx
import { parseFacebookUrl } from "@/lib/facebook";
import { getYouTubeEmbedUrl, parseYouTubeUrl } from "@/lib/youtube";

interface MediaSectionProps {
  mainImage?: string;
  youtubeUrl?: string | null;
  youtubeVideoId?: string | null;
  facebookUrl?: string | null;
  title: string;
}

export function MediaSection({
  mainImage,
  youtubeUrl,
  youtubeVideoId,
  facebookUrl,
  title,
}: MediaSectionProps) {
  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "https://api.radioyeraz.com";

  const youtubeEmbedUrl =
    (youtubeVideoId ? getYouTubeEmbedUrl(youtubeVideoId) : null) ||
    parseYouTubeUrl(youtubeUrl)?.embedUrl;
  const facebookEmbedUrl = parseFacebookUrl(facebookUrl)?.embedUrl;

  if (youtubeEmbedUrl) {
    return (
      <div className="relative aspect-video max-h-[600px] overflow-hidden bg-black">
        <iframe
          src={youtubeEmbedUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (facebookEmbedUrl) {
    return (
      <div className="relative aspect-video max-h-[600px] overflow-hidden bg-black">
        <iframe
          src={facebookEmbedUrl}
          title={title}
          className="h-full w-full"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (mainImage) {
    // ✅ Build the full URL
    const imageUrl = mainImage.startsWith("http")
      ? mainImage
      : `${mediaUrl}${mainImage}`;

    return (
      <div className="relative aspect-video max-h-[600px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          alt={title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
      </div>
    );
  }

  return null;
}
