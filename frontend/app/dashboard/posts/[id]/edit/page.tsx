"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Upload, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";
import { postsAPI } from "@/lib/api/api";
import { SimpleImageUpload } from "@/components/posts/PostImageUpload";
import Swal from "sweetalert2";

type MediaType = "image" | "video" | "none";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState("");
  const [currentVideoPath, setCurrentVideoPath] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [postMeta, setPostMeta] = useState({
    postedDate: "",
    expiresAt: "",
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    profileName: "",
    eventDate: "",
    location: "",
    link: "",
    isLive: false,
    isPublished: false,
  });

  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await postsAPI.getPost(postId);
        const post = response.data.data || response.data;

        setFormData({
          title: post.title || "",
          description: post.description || "",
          profileName: post.profileName || "",
          eventDate: post.eventDate?.split("T")[0] || "",
          location: post.location || "",
          link: post.link || "",
          isLive: post.isLive ?? false,
          isPublished: post.isPublished ?? false,
        });

        setPostMeta({
          postedDate: post.postedDate || "",
          expiresAt: post.expiresAt || "",
        });

        if (post.video && post.video !== "") {
          setMediaType("video");
          setCurrentVideoPath(post.video);
          setCurrentImagePath("");
        } else if (post.mainImage && post.mainImage !== "[object Object]") {
          setMediaType("image");
          setCurrentImagePath(post.mainImage);
          setCurrentVideoPath("");
        } else {
          setMediaType("none");
        }
      } catch {
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const postStatus = useMemo(() => {
    const now = new Date();
    const eventDate = formData.eventDate ? new Date(formData.eventDate) : null;
    const eventExpiry =
      eventDate && !Number.isNaN(eventDate.getTime())
        ? new Date(eventDate.getTime() + 5 * 24 * 60 * 60 * 1000)
        : null;
    const expiresAt = postMeta.expiresAt ? new Date(postMeta.expiresAt) : null;
    const postedDate = postMeta.postedDate ? new Date(postMeta.postedDate) : null;

    if (eventExpiry && eventExpiry < now) return "Expired";
    if (!eventExpiry && expiresAt && expiresAt < now) return "Expired";
    if (postedDate && postedDate > now) return "Scheduled";
    if (formData.isLive) return "Live";
    if (formData.isPublished) return "Published";
    return "Draft";
  }, [formData.eventDate, formData.isLive, formData.isPublished, postMeta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Title is required",
        confirmButtonColor: "#7c3aed",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save changes?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!",
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("profileName", formData.profileName || "");
      formDataToSend.append("eventDate", formData.eventDate);
      formDataToSend.append("location", formData.location || "");
      formDataToSend.append("link", formData.link || "");
      formDataToSend.append("isLive", String(formData.isLive));
      formDataToSend.append("isPublished", String(formData.isPublished));

      if (mediaType === "image") {
        if (selectedFile) {
          formDataToSend.append("mainImage", selectedFile);
        }
        formDataToSend.append("removeVideo", "true");
      }

      if (mediaType === "video") {
        if (selectedVideoFile) {
          formDataToSend.append("video", selectedVideoFile);
        }
        formDataToSend.append("removeImage", "true");
      }

      if (mediaType === "none") {
        formDataToSend.append("removeImage", "true");
        formDataToSend.append("removeVideo", "true");
      }

      Swal.fire({
        title: "Updating post...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await postsAPI.updatePost(postId, formDataToSend);
      Swal.close();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Post updated successfully",
          confirmButtonColor: "#7c3aed",
        });

        router.push(`/dashboard/posts/${postId}`);
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: response.message || "Something went wrong",
        });
      }
    } catch (error: unknown) {
  Swal.close();

  let errorMessage = "Failed to update post";

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const err = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    errorMessage =
      err.response?.data?.message || errorMessage;
  }

  Swal.fire({
    icon: "error",
    title: "Error",
    text: errorMessage,
  });
} finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const currentImageUrl = currentImagePath
    ? currentImagePath.startsWith("http")
      ? currentImagePath
      : `${mediaUrl}${currentImagePath}`
    : undefined;

  const currentVideoUrl = currentVideoPath
    ? currentVideoPath.startsWith("http")
      ? currentVideoPath
      : `${mediaUrl}${currentVideoPath}`
    : undefined;

  const badgeClass =
    postStatus === "Live"
      ? "bg-red-100 text-red-700"
      : postStatus === "Published"
        ? "bg-green-100 text-green-700"
        : postStatus === "Scheduled"
          ? "bg-blue-100 text-blue-700"
          : postStatus === "Expired"
            ? "bg-gray-100 text-gray-700"
            : "bg-yellow-100 text-yellow-700";

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Post</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
            {postStatus}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium mb-3">
              Media Type
            </label>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMediaType("image");
                  setSelectedVideoFile(null);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium ${
                  mediaType === "image"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                <ImageIcon size={16} />
                Image
              </button>

              <button
                type="button"
                onClick={() => {
                  setMediaType("video");
                  setSelectedFile(null);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium ${
                  mediaType === "video"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                <Video size={16} />
                Video
              </button>

              <button
                type="button"
                onClick={() => {
                  setMediaType("none");
                  setSelectedFile(null);
                  setSelectedVideoFile(null);
                  setCurrentImagePath("");
                  setCurrentVideoPath("");
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium ${
                  mediaType === "none"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                <Upload size={16} />
                Remove
              </button>
            </div>
          </div>

          {mediaType === "video" && currentVideoUrl && !selectedVideoFile && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Current Video
              </label>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={currentVideoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {mediaType === "image" && (
            <SimpleImageUpload
              onImageSelect={setSelectedFile}
              currentImageUrl={currentImageUrl}
              label="Post Image"
            />
          )}

          {mediaType === "video" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload New Video
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setSelectedVideoFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              {selectedVideoFile && (
                <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700 mt-3">
                  ✅ New video selected: {selectedVideoFile.name}
                </div>
              )}
            </div>
          )}

          {mediaType === "none" && (
            <div className="p-4 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm">
              No media selected. This post will be saved without image or video.
            </div>
          )}

          {selectedFile && mediaType === "image" && (
            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
              ✅ New image selected: {selectedFile.name}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Profile Name
            </label>
            <input
              type="text"
              value={formData.profileName}
              onChange={(e) =>
                setFormData({ ...formData, profileName: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event Date</label>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) =>
                setFormData({ ...formData, eventDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Link</label>
            <input
              type="text"
              value={formData.link}
              onChange={(e) =>
                setFormData({ ...formData, link: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isLive"
              checked={formData.isLive}
              onChange={(e) => {
                const newValue = e.target.checked;
                setFormData({ ...formData, isLive: newValue });
              }}
              className="w-5 h-5 text-purple-600 rounded"
            />
            <label
              htmlFor="isLive"
              className="text-sm font-medium cursor-pointer"
            >
              Live (Currently: {formData.isLive ? "🔴 Live" : "⚫ Offline"})
            </label>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => {
                const newValue = e.target.checked;
                setFormData({ ...formData, isPublished: newValue });
              }}
              className="w-5 h-5 text-purple-600 rounded"
            />
            <label
              htmlFor="isPublished"
              className="text-sm font-medium cursor-pointer"
            >
              Published (Currently:{" "}
              {formData.isPublished ? "✅ Published" : "📝 Draft"})
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
