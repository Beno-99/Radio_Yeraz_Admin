"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Upload, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";
import { postsAPI } from "@/lib/api/api";
import { SimpleImageUpload } from "@/components/posts/PostImageUpload";
import { ExternalLinksInput } from "@/components/posts/ExternalLinksInput";
import { parseFacebookUrl } from "@/lib/facebook";
import {
  areExternalLinksValid,
  parseExternalLinks,
  serializeExternalLinks,
} from "@/lib/postLinks";
import {
  getEffectiveLiveStatus,
  type PostLiveStatus,
} from "@/lib/postLiveStatus";
import { getYouTubeEmbedUrl, parseYouTubeUrl } from "@/lib/youtube";
import Swal from "sweetalert2";

type MediaType = "image" | "youtube" | "facebook" | "none";

const DEFAULT_EXPIRE_AFTER_DAYS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

const getExpireAfterDays = (postedDate?: string, expiresAt?: string) => {
  if (!postedDate || !expiresAt) return DEFAULT_EXPIRE_AFTER_DAYS;

  const posted = new Date(postedDate);
  const expiry = new Date(expiresAt);

  if (Number.isNaN(posted.getTime()) || Number.isNaN(expiry.getTime())) {
    return DEFAULT_EXPIRE_AFTER_DAYS;
  }

  return Math.max(
    1,
    Math.ceil((expiry.getTime() - posted.getTime()) / DAY_MS),
  );
};

const getExpiryDateFromDays = (postedDate: string, daysValue: string) => {
  const posted = postedDate ? new Date(postedDate) : new Date();
  const days = Number(daysValue) || DEFAULT_EXPIRE_AFTER_DAYS;
  const baseDate = Number.isNaN(posted.getTime()) ? new Date() : posted;

  return new Date(baseDate.getTime() + days * DAY_MS);
};

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState("");
  const [currentYoutubeVideoId, setCurrentYoutubeVideoId] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [postMeta, setPostMeta] = useState({
    postedDate: "",
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    profileName: "",
    eventDate: "",
    location: "",
    link: "",
    youtubeUrl: "",
    facebookUrl: "",
    isLive: false,
    liveStatus: "UNKNOWN" as PostLiveStatus,
    isPublished: false,
    reminderEnabled: false,
    autoExpire: true,
    expireAfterDays: String(DEFAULT_EXPIRE_AFTER_DAYS),
  });

  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "https://api.radioyeraz.com";

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
          youtubeUrl: post.youtubeUrl || "",
          facebookUrl: post.facebookUrl || "",
          isLive: post.isLive ?? false,
          liveStatus: post.liveStatus || "UNKNOWN",
          isPublished: post.isPublished ?? false,
          reminderEnabled: post.reminderEnabled ?? false,
          autoExpire: Boolean(post.expiresAt),
          expireAfterDays: String(
            getExpireAfterDays(post.postedDate, post.expiresAt),
          ),
        });

        setPostMeta({
          postedDate: post.postedDate || "",
        });

        if (post.facebookUrl || post.videoSource === "FACEBOOK") {
          setMediaType("facebook");
          setCurrentYoutubeVideoId("");
          setCurrentImagePath("");
        } else if (post.youtubeVideoId || post.youtubeUrl || post.videoSource === "YOUTUBE") {
          const parsedYoutube = parseYouTubeUrl(post.youtubeUrl || "");
          setMediaType("youtube");
          setCurrentYoutubeVideoId(post.youtubeVideoId || parsedYoutube?.videoId || "");
          setCurrentImagePath("");
        } else if (post.mainImage && post.mainImage !== "[object Object]") {
          setMediaType("image");
          setCurrentImagePath(post.mainImage);
          setCurrentYoutubeVideoId("");
        } else {
          setMediaType("none");
          setCurrentYoutubeVideoId("");
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
    const expiresAt = formData.autoExpire
      ? getExpiryDateFromDays(postMeta.postedDate, formData.expireAfterDays)
      : null;
    const postedDate = postMeta.postedDate ? new Date(postMeta.postedDate) : null;
    const effectiveLiveStatus = getEffectiveLiveStatus(
      formData.liveStatus,
      formData.isLive,
    );

    if (expiresAt && expiresAt < now) return "Expired";
    if (postedDate && postedDate > now) return "Scheduled";
    if (effectiveLiveStatus === "LIVE") return "Live";
    if (effectiveLiveStatus === "UPCOMING") return "Upcoming";
    if (effectiveLiveStatus === "WAS_LIVE") return "Was Live";
    if (formData.isPublished) return "Published";
    return "Draft";
  }, [
    formData.autoExpire,
    formData.expireAfterDays,
    formData.isLive,
    formData.liveStatus,
    formData.isPublished,
    postMeta.postedDate,
  ]);

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

    if (mediaType === "youtube" && !parseYouTubeUrl(formData.youtubeUrl)) {
      await Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Enter a valid YouTube URL",
        confirmButtonColor: "#7c3aed",
      });
      return;
    }

    if (mediaType === "facebook" && !parseFacebookUrl(formData.facebookUrl)) {
      await Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Enter a valid public Facebook video or live URL",
        confirmButtonColor: "#7c3aed",
      });
      return;
    }

    const expireAfterDays = Number(formData.expireAfterDays);
    if (
      formData.autoExpire &&
      (!Number.isInteger(expireAfterDays) ||
        expireAfterDays < 1 ||
        expireAfterDays > 365)
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Keep days must be between 1 and 365",
        confirmButtonColor: "#7c3aed",
      });
      return;
    }

    if (!areExternalLinksValid(formData.link)) {
      await Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Enter valid http or https links",
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
      formDataToSend.append(
        "link",
        serializeExternalLinks(parseExternalLinks(formData.link)),
      );
      formDataToSend.append("isLive", String(formData.isLive));
      formDataToSend.append("isPublished", String(formData.isPublished));
      formDataToSend.append(
        "reminderEnabled",
        String(Boolean(formData.eventDate && formData.reminderEnabled)),
      );
      formDataToSend.append("autoExpire", String(formData.autoExpire));
      if (formData.autoExpire) {
        formDataToSend.append("expireAfterDays", String(expireAfterDays));
      }

      if (mediaType === "image") {
        if (selectedFile) {
          formDataToSend.append("mainImage", selectedFile);
        }
        formDataToSend.append("youtubeUrl", "");
        formDataToSend.append("facebookUrl", "");
      }

      if (mediaType === "youtube") {
        formDataToSend.append("youtubeUrl", formData.youtubeUrl.trim());
        formDataToSend.append("facebookUrl", "");
        formDataToSend.append("removeImage", "true");
      }

      if (mediaType === "facebook") {
        formDataToSend.append("facebookUrl", formData.facebookUrl.trim());
        formDataToSend.append("youtubeUrl", "");
        formDataToSend.append("removeImage", "true");
      }

      if (mediaType === "none") {
        formDataToSend.append("removeImage", "true");
        formDataToSend.append("youtubeUrl", "");
        formDataToSend.append("facebookUrl", "");
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

  const youtubePreview = parseYouTubeUrl(formData.youtubeUrl);
  const currentYoutubeEmbedUrl =
    youtubePreview?.embedUrl ||
    (currentYoutubeVideoId ? getYouTubeEmbedUrl(currentYoutubeVideoId) : null);
  const facebookPreview = parseFacebookUrl(formData.facebookUrl);
  const currentFacebookEmbedUrl = facebookPreview?.embedUrl ?? null;

  const getBadgeClass = () => {
    if (postStatus === "Live") return "bg-red-100 text-red-700";
    if (postStatus === "Published") return "bg-green-100 text-green-700";
    if (postStatus === "Scheduled" || postStatus === "Upcoming") {
      return "bg-blue-100 text-blue-700";
    }
    if (postStatus === "Expired" || postStatus === "Was Live") {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  const badgeClass = getBadgeClass();

  const projectedExpiryDate = formData.autoExpire
    ? getExpiryDateFromDays(postMeta.postedDate, formData.expireAfterDays)
    : null;
  const projectedExpiryText = projectedExpiryDate
    ? projectedExpiryDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const hasImageMedia =
    mediaType === "image" && (Boolean(currentImagePath) || Boolean(selectedFile));
  const hasYoutubeMedia =
    mediaType === "youtube" &&
    (Boolean(currentYoutubeVideoId) || formData.youtubeUrl.trim().length > 0);
  const hasFacebookMedia =
    mediaType === "facebook" && formData.facebookUrl.trim().length > 0;
  const imageChoiceDisabled = hasYoutubeMedia || hasFacebookMedia;
  const youtubeChoiceDisabled = hasImageMedia || hasFacebookMedia;
  const facebookChoiceDisabled = hasImageMedia || hasYoutubeMedia;

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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <button
                type="button"
                disabled={imageChoiceDisabled}
                onClick={() => {
                  setMediaType("image");
                  setCurrentYoutubeVideoId("");
                  setFormData({ ...formData, youtubeUrl: "", facebookUrl: "" });
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                  imageChoiceDisabled
                    ? "bg-gray-100 text-gray-400 border-gray-200"
                    : mediaType === "image"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                <ImageIcon size={16} />
                Image
              </button>

              <button
                type="button"
                disabled={youtubeChoiceDisabled}
                onClick={() => {
                  setMediaType("youtube");
                  setSelectedFile(null);
                  setCurrentImagePath("");
                  setFormData({ ...formData, facebookUrl: "" });
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                  youtubeChoiceDisabled
                    ? "bg-gray-100 text-gray-400 border-gray-200"
                    : mediaType === "youtube"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                <Video size={16} />
                YouTube
              </button>

              <button
                type="button"
                disabled={facebookChoiceDisabled}
                onClick={() => {
                  setMediaType("facebook");
                  setSelectedFile(null);
                  setCurrentImagePath("");
                  setCurrentYoutubeVideoId("");
                  setFormData({ ...formData, youtubeUrl: "" });
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                  facebookChoiceDisabled
                    ? "bg-gray-100 text-gray-400 border-gray-200"
                    : mediaType === "facebook"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                <Video size={16} />
                Facebook
              </button>

              <button
                type="button"
                onClick={() => {
                  setMediaType("none");
                  setSelectedFile(null);
                  setCurrentImagePath("");
                  setCurrentYoutubeVideoId("");
                  setFormData({ ...formData, youtubeUrl: "", facebookUrl: "" });
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

          {mediaType === "image" && (
            <SimpleImageUpload
              onImageSelect={setSelectedFile}
              onImageRemove={() => {
                setSelectedFile(null);
                setCurrentImagePath("");
              }}
              currentImageUrl={currentImageUrl}
              label="Post Image"
            />
          )}

          {mediaType === "youtube" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium mb-2">
                YouTube URL
              </label>
              <input
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => {
                  setCurrentYoutubeVideoId("");
                  setFormData({ ...formData, youtubeUrl: e.target.value });
                }}
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              {currentYoutubeEmbedUrl && (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={currentYoutubeEmbedUrl}
                    title="YouTube preview"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          {mediaType === "facebook" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium mb-2">
                Facebook Live URL
              </label>
              <input
                type="url"
                value={formData.facebookUrl}
                onChange={(e) =>
                  setFormData({ ...formData, facebookUrl: e.target.value })
                }
                placeholder="https://www.facebook.com/page/videos/VIDEO_ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              {currentFacebookEmbedUrl && (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={currentFacebookEmbedUrl}
                    title="Facebook preview"
                    className="h-full w-full"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                  />
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
              onChange={(e) => {
                const eventDate = e.target.value;
                setFormData({
                  ...formData,
                  eventDate,
                  reminderEnabled: eventDate
                    ? formData.reminderEnabled
                    : false,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="reminderEnabled"
              checked={formData.reminderEnabled}
              disabled={!formData.eventDate}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  reminderEnabled: e.target.checked,
                });
              }}
              className="mt-1 w-5 h-5 text-purple-600 rounded disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div>
              <label
                htmlFor="reminderEnabled"
                className={`text-sm font-medium ${
                  formData.eventDate
                    ? "cursor-pointer text-gray-900"
                    : "cursor-not-allowed text-gray-400"
                }`}
              >
                Send Mobile Reminder
              </label>
              <p className="text-sm text-gray-500">
                {formData.eventDate
                  ? "Send a Firebase push notification to mobile users on the event day."
                  : "Choose an event date before enabling the mobile reminder."}
              </p>
            </div>
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
            <label className="block text-sm font-medium mb-2">
              External Links
            </label>
            <ExternalLinksInput
              value={formData.link}
              onChange={(link) => setFormData({ ...formData, link })}
              disabled={saving}
            />
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isLive"
              checked={formData.isLive}
              onChange={(e) => {
                const newValue = e.target.checked;
                setFormData({
                  ...formData,
                  isLive: newValue,
                  liveStatus: newValue ? "LIVE" : "WAS_LIVE",
                });
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

          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="autoExpire"
                checked={formData.autoExpire}
                onChange={(e) => {
                  setFormData({ ...formData, autoExpire: e.target.checked });
                }}
                className="mt-1 w-5 h-5 text-purple-600 rounded"
              />
              <div>
                <label
                  htmlFor="autoExpire"
                  className="text-sm font-medium cursor-pointer"
                >
                  Auto Expire
                </label>
                <p className="text-sm text-gray-500">
                  Hide this post automatically after the selected number of days.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Keep Post For (Days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={formData.expireAfterDays}
                disabled={!formData.autoExpire}
                onChange={(e) =>
                  setFormData({ ...formData, expireAfterDays: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              />
              <p className="mt-2 text-sm text-gray-500">
                {formData.autoExpire && projectedExpiryText
                  ? `This post will expire on ${projectedExpiryText}.`
                  : "This post will stay visible until you unpublish it."}
              </p>
            </div>
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
