// components/forms/MediaUploadCard.tsx
import { useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/lib/icons";

interface MediaUploadCardProps {
  title: string;
  preview: string | null;
  type: "image" | "video";
  disabled: boolean;
  onRemove: () => void;
  onChange: (file: File) => void;
  accept: string;
  maxSize?: string;
}

export function MediaUploadCard({
  title,
  preview,
  type,
  disabled,
  onRemove,
  onChange,
  accept,
  maxSize = "10MB",
}: MediaUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = type === "image" ? Icons.Image : Icons.Video;
  const isImage = type === "image";

  const colorClasses = isImage
    ? {
        border: "border-blue-300",
        bg: "bg-blue-50",
        icon: "text-blue-600",
        button: "bg-blue-600 hover:bg-blue-700",
      }
    : {
        border: "border-purple-300",
        bg: "bg-purple-50",
        icon: "text-purple-600",
        button: "bg-purple-600 hover:bg-purple-700",
      };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  };

  // If disabled and no preview, don't show the upload area at all
  if (disabled && !preview) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <Icon className={cn("h-5 w-5", colorClasses.icon, "opacity-50")} />
        </div>

        <div className="flex items-center text-sm text-amber-600 bg-amber-50 p-4 rounded-lg border border-amber-200">
          <Icons.Alert className="h-4 w-4 mr-2" />
          {isImage
            ? "Cannot upload image when video is selected"
            : "Cannot upload video when image is selected"}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Icon className={cn("h-5 w-5", colorClasses.icon)} />
      </div>

      <div className="space-y-4">
        {/* Preview */}
        {preview && (
          <div className="relative group">
            <div
              className={cn(
                "relative w-full h-64 rounded-xl overflow-hidden border",
                isImage ? "border-gray-200" : "border-gray-200 bg-black",
              )}
            >
              {isImage ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={preview}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100"
              >
                Change
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Upload Area - Only show if not disabled OR has preview */}
        {(!disabled || preview) && (
          <div
            className={cn(
              "border-2 border-dashed rounded-xl transition-all duration-200",
              disabled && !preview
                ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                : preview
                  ? colorClasses.border + " " + colorClasses.bg
                  : "border-gray-300 hover:border-blue-400 bg-white hover:bg-blue-50",
              disabled && !preview && "opacity-60",
            )}
          >
            <label
              className={cn(
                "flex flex-col items-center justify-center p-8",
                disabled && !preview ? "cursor-not-allowed" : "cursor-pointer",
              )}
            >
              <div
                className={cn(
                  "p-3 rounded-full mb-4",
                  disabled && !preview
                    ? "bg-gray-200"
                    : isImage
                      ? "bg-blue-100"
                      : "bg-purple-100",
                )}
              >
                <Icon
                  className={cn(
                    "h-8 w-8",
                    disabled && !preview ? "text-gray-400" : colorClasses.icon,
                  )}
                />
              </div>

              <span
                className={cn(
                  "text-sm font-medium mb-2 text-center",
                  disabled && !preview ? "text-gray-500" : "text-gray-900",
                )}
              >
                {preview
                  ? "Change " + (isImage ? "Image" : "Video")
                  : "Upload " + (isImage ? "Image" : "Video")}
              </span>

              <span
                className={cn(
                  "text-xs mb-3 text-center",
                  disabled && !preview ? "text-gray-400" : "text-gray-500",
                )}
              >
                {isImage
                  ? `PNG, JPG, GIF up to ${maxSize}`
                  : `MP4, MOV, AVI up to ${maxSize}`}
              </span>

              {!disabled && (
                <div
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium text-white",
                    colorClasses.button,
                  )}
                >
                  Choose File
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept={accept}
                disabled={disabled}
                onChange={handleChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {disabled && !preview && (
          <div className="flex items-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <Icons.Alert className="h-4 w-4 mr-2" />
            {isImage
              ? "Remove the video first to upload an image"
              : "Remove the image first to upload a video"}
          </div>
        )}
      </div>
    </div>
  );
}
