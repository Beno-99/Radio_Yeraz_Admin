"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { carouselsAPI } from "@/lib/api/api";
import { CarouselImageUpload } from "@/components/carousels/CarouselImageUpload";
import Swal from "sweetalert2";

export default function EditCarouselPage() {
  const router = useRouter();
  const params = useParams();
  const carouselId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState("");
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [imageFieldError, setImageFieldError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    targetUrl: "",
    startDate: "",
    endDate: "",
    isActive: true,
    displayOrder: "0",
  });
  const [serverStatus, setServerStatus] = useState<
    "pending" | "active" | "inactive" | "expired" | ""
  >("");

  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "https://api.radioyeraz.com";

  useEffect(() => {
    const fetchCarousel = async () => {
      try {
        const response = await carouselsAPI.getCarouselById(carouselId);
        const carousel = response.data.data || response.data;

        setFormData({
          name: carousel.name || "",
          targetUrl: carousel.targetUrl || "",
          startDate: carousel.startDate?.split("T")[0] || "",
          endDate: carousel.endDate?.split("T")[0] || "",
          isActive: carousel.isActive ?? true,
          displayOrder: String(carousel.displayOrder ?? 0),
        });
        setServerStatus((carousel.status || "").toLowerCase());

        if (carousel.image && carousel.image !== "[object Object]") {
          setCurrentImagePath(carousel.image);
        }
      } catch {
        toast.error("Failed to load carousel");
      } finally {
        setLoading(false);
      }
    };

    fetchCarousel();
  }, [carouselId]);

  const carouselStatus = useMemo(() => {
    const now = new Date();
    const start = formData.startDate ? new Date(formData.startDate) : null;
    const end = formData.endDate ? new Date(formData.endDate) : null;

    if (end && !Number.isNaN(end.getTime()) && now > end) return "expired";
    if (start && !Number.isNaN(start.getTime()) && now < start) return "pending";
    return formData.isActive ? "active" : "inactive";
  }, [formData.startDate, formData.endDate, formData.isActive]);

  const carouselStatusLabel =
    carouselStatus.charAt(0).toUpperCase() + carouselStatus.slice(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageFieldError("");

    const hasCurrentImage = Boolean(currentImagePath) && !removeCurrentImage;
    const hasNewImage = Boolean(selectedFile);

    if (!hasCurrentImage && !hasNewImage) {
      setImageFieldError("Image is required");
      return;
    }

    setSaving(true);

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("targetUrl", formData.targetUrl || "");
    formDataToSend.append("startDate", formData.startDate);
    formDataToSend.append("endDate", formData.endDate);
    formDataToSend.append("isActive", String(formData.isActive));
    formDataToSend.append("displayOrder", formData.displayOrder || "0");

    if (selectedFile) {
      formDataToSend.append("image", selectedFile);
    }
    if (removeCurrentImage && !selectedFile) {
      formDataToSend.append("removeImage", "true");
    }

    try {
      Swal.fire({
        title: "Updating...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await carouselsAPI.updateCarousel(
        carouselId,
        formDataToSend,
      );

      Swal.close();

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Carousel updated successfully!",
          confirmButtonColor: "#7c3aed",
        });

        router.push(`/dashboard/carousels/${carouselId}`);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.data.message || "Update failed",
        });
      }
    } catch (error: unknown) {
  Swal.close();

  let message = "Failed to update carousel";

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

    message = err.response?.data?.message || message;
  }

  Swal.fire({
    icon: "error",
    title: "Something went wrong",
    text: message,
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

  const badgeClass =
    carouselStatus === "active"
      ? "bg-green-100 text-green-700"
      : carouselStatus === "pending"
        ? "bg-amber-100 text-amber-700"
        : carouselStatus === "expired"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-700";

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
          <h1 className="text-2xl font-bold">Edit Carousel</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
            {carouselStatusLabel}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <CarouselImageUpload
            onImageSelect={(file) => {
              setSelectedFile(file);
              setImageFieldError("");
              if (file) setRemoveCurrentImage(false);
            }}
            onImageRemove={() => {
              setSelectedFile(null);
              setRemoveCurrentImage(true);
            }}
            currentImage={removeCurrentImage ? undefined : currentImageUrl}
          />

          {imageFieldError && (
            <p className="text-sm text-red-600">{imageFieldError}</p>
          )}

          {currentImageUrl && !selectedFile && (
            <button
              type="button"
              onClick={() => setRemoveCurrentImage((prev) => !prev)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                removeCurrentImage
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {removeCurrentImage ? "Undo Remove Image" : "Remove Current Image"}
            </button>
          )}

          {removeCurrentImage && !selectedFile && (
            <div className="bg-red-50 p-3 rounded-lg text-sm text-red-700">
              Current image will be removed when you save.
            </div>
          )}

          {selectedFile && (
            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
              ✅ New image selected: {selectedFile.name}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Carousel Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target URL</label>
            <input
              type="text"
              value={formData.targetUrl}
              onChange={(e) =>
                setFormData({ ...formData, targetUrl: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://example.com (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Display Order
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.displayOrder}
              onChange={(e) =>
                setFormData({ ...formData, displayOrder: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Carousel is active
            </label>
            <span
              className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                carouselStatus === "active"
                  ? "bg-green-100 text-green-700"
                  : carouselStatus === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : carouselStatus === "expired"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
              }`}
            >
              {carouselStatusLabel}
            </span>
          </div>

          {serverStatus && serverStatus !== carouselStatus && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Saved status: <strong>{serverStatus}</strong>. It will sync to{" "}
              <strong>{carouselStatus}</strong> when you save (or by daily cron).
            </div>
          )}

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
