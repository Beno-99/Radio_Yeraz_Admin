// components/posts/EditPostHeader.tsx
"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditPostHeaderProps {
  title: string;
}

export function EditPostHeader({ title }: EditPostHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
          <p className="text-gray-600 mt-1">{title}</p>
        </div>
      </div>
      <div className="flex gap-3">{/* Edit page specific buttons */}</div>
    </div>
  );
}
