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
  const facebookPreview = parseFacebookUrl(facebookUrl);

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

  if (facebookPreview) {
    return (
      <div className="relative aspect-video max-h-[600px] overflow-hidden bg-blue-950">
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center text-white">
          <div className="rounded-full bg-blue-600 px-5 py-2 text-base font-bold">
            Facebook Video
          </div>
          <p className="max-w-md text-sm text-blue-100">
            Facebook may block embedded previews. Open the video directly on
            Facebook to watch it.
          </p>
          <a
            href={facebookPreview.normalizedUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
          >
            Watch on Facebook
          </a>
        </div>
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
