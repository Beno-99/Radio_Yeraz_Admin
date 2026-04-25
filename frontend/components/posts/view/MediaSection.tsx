// components/forms/MediaSection.tsx
import { Clock } from "lucide-react";

interface MediaSectionProps {
  mainImage?: string;
  video?: string;
  title: string;
}

export function MediaSection({ mainImage, video, title }: MediaSectionProps) {
  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "http://localhost:8000";

  if (mainImage) {
    // ✅ Build the full URL
    const imageUrl = mainImage.startsWith("http")
      ? mainImage
      : `${mediaUrl}${mainImage}`;

    return (
      <div className="relative aspect-video max-h-[600px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={imageUrl}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          alt={title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
      </div>
    );
  }

  // ... rest of the component
}
