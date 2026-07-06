// components/forms/ImageUpload.tsx
"use client";

import { useState, useRef, useEffect,useMemo } from "react";
import { ImageIcon, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onChange: (file: File | null) => void;
  currentImage?: string;
  label?: string;
  required?: boolean;
}

export function ImageUpload({
  onChange,
  currentImage,
  label = "Image",
  required = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "https://api.radioyeraz.com";

  // Fix: Use useMemo to compute the initial preview URL without side effects
  const initialPreviewUrl = useMemo(() => {
    if (currentImage && !preview) {
      return currentImage.startsWith("http")
        ? currentImage
        : `${mediaUrl}${currentImage}`;
    }
    return null;
  }, [currentImage, mediaUrl, preview]);

  // Fix: Use setTimeout to avoid synchronous setState in useEffect
  useEffect(() => {
    if (initialPreviewUrl && !preview) {
      // Use setTimeout to move state update to next tick, preventing cascading renders
      const timer = setTimeout(() => {
        setPreview(initialPreviewUrl);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [initialPreviewUrl, preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("📸 [ImageUpload] File selected:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    if (!file.type.startsWith("image/")) {
      alert("Please select an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    console.log("📤 [ImageUpload] Calling onChange with file:", file.name);
    onChange(file);
  };

  const handleRemove = () => {
    console.log("🗑️ [ImageUpload] Removing image");
    // Clean up the object URL to prevent memory leaks
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
        {preview ? (
          <div className="relative group">
            {/* Replace img with Next.js Image component */}
            <div className="relative w-full h-48">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 100%"
                unoptimized={preview.startsWith("blob:")}
              />
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-white text-sm rounded hover:bg-gray-100"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer py-8 flex flex-col items-center justify-center hover:bg-gray-50"
          >
            <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
