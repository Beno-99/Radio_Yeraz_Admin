"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { adsAPI } from "@/lib/api/api";
import { AdImageUpload } from "@/components/ads/AdImageUpload";
import Swal from "sweetalert2";

export default function EditAdPage() {
  const router = useRouter();
  const params = useParams();
  const adId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    targetUrl: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const response = await adsAPI.getAdById(adId);
        const ad = response.data.data || response.data;

        setFormData({
          name: ad.name || "",
          targetUrl: ad.targetUrl || "",
          startDate: ad.startDate?.split("T")[0] || "",
          endDate: ad.endDate?.split("T")[0] || "",
          isActive: ad.isActive ?? true,
        });

        if (ad.image && ad.image !== "[object Object]") {
          setCurrentImagePath(ad.image);
        }
      } catch {
        toast.error("Failed to load ad");
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [adId]);

  const adStatus = useMemo(() => {
    return formData.isActive ? "Active" : "Inactive";
  }, [formData.isActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("targetUrl", formData.targetUrl || "");
    formDataToSend.append("startDate", formData.startDate);
    formDataToSend.append("endDate", formData.endDate);
    formDataToSend.append("isActive", String(formData.isActive));

    if (selectedFile) {
      formDataToSend.append("image", selectedFile);
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

      const response = await adsAPI.updateAd(adId, formDataToSend);

      Swal.close();

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Ad updated successfully!",
          confirmButtonColor: "#7c3aed",
        });

        router.push(`/dashboard/ads/${adId}`);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.data.message || "Update failed",
        });
      }
    } catch (error: any) {
      Swal.close();

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: error.response?.data?.message || "Failed to update ad",
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
    adStatus === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";

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
          <h1 className="text-2xl font-bold">Edit Ad</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
            {adStatus}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AdImageUpload
            onImageSelect={setSelectedFile}
            currentImage={currentImageUrl}
          />

          {selectedFile && (
            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
              ✅ New image selected: {selectedFile.name}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Ad Name <span className="text-red-500">*</span>
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
              Ad is active
            </label>
            <span
              className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                formData.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {adStatus}
            </span>
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
