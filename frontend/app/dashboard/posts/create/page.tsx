// app/dashboard/posts/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { postFormFields } from "@/config/postForm.fields";
import { postFormSchema, PostFormValues } from "@/config/postForm.schema";
import { postsAPI } from "@/lib/api/api";
import { z } from "zod";

// Extend schema to make location required and add validation hint
const extendedSchema = postFormSchema.extend({
  location: z
    .string()
    .min(1, "Location is required")
    .refine((val) => val.includes(","), {
      message: "Please include a comma (e.g. Aleppo, Syria)",
    }),
});

export default function CreatePostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PostFormValues) => {
    try {
      setLoading(true);
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        } else if (value !== undefined && value !== null) {
          formData.append(key, value as string);
        }
      });

      await postsAPI.createPost(formData);
      router.push("/dashboard/posts");
    } catch (err: unknown) {
  const message =
    err instanceof Error
      ? err.message
      : "Failed to create post";

  setError(message);
} finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create New Post
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Share your content with the community
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => router.push("/dashboard/posts")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ← Back to Posts
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FormBuilder with updated location field */}
        <FormBuilder<PostFormValues>
          fields={[
            ...postFormFields,
            
          ]}
          schema={extendedSchema} // ← use extended schema with validation
          onSubmit={handleSubmit}
          defaultValues={{
            isLive: false,
            isPublished: false,
            autoExpire: true,
            expireAfterDays: 5,
            youtubeUrl: "",
            facebookUrl: "",
            location: "",
          }}
          submitText="Create Post"
          loading={loading}
        />

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Tips for a great post
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use a descriptive title that captures attention</li>
                  <li>Add high-quality images for better engagement</li>
                  <li>Include relevant links to external sources</li>
                  <li>
  Set to &quot;Publish&quot; only when you&apos;re ready to publish
</li>

<li>
  Set to &quot;Live&quot; only when it is a streaming event
</li>

<li>
  <strong>Location:</strong> Always use format
  {" "}
  &quot;City, Country&quot;
  {" "}
  (e.g. Aleppo, Syria)
</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
