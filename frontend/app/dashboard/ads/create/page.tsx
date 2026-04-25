// app/dashboard/ads/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AdImageUpload } from "@/components/ads/AdImageUpload";
import { adsAPI } from "@/lib/api/api";

export default function CreateAdPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    targetUrl: "",
    startDate: "",
    endDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedImage) {
      toast.error("Please select an image");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Ad name is required");
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Append image first
      formDataToSend.append("image", selectedImage);

      // Append other fields
      formDataToSend.append("name", formData.name);

      if (formData.targetUrl) {
        formDataToSend.append("targetUrl", formData.targetUrl);
      }

      if (formData.startDate) {
        formDataToSend.append("startDate", formData.startDate);
      }

      if (formData.endDate) {
        formDataToSend.append("endDate", formData.endDate);
      }

      // Send request
      const token = localStorage.getItem("access_token");

      const response = await adsAPI.createAd(formDataToSend);

      const data = await response.data;

      if (response.status === 201) {
        toast.success("Ad created successfully");
        router.push("/dashboard/ads");
      } else {
        toast.error(data.message || "Failed to create ad");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create ad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Ads
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Ad</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AdImageUpload
            onImageSelect={setSelectedImage}
            onImageRemove={() => setSelectedImage(null)}
          />

          {selectedImage && (
            <div className="bg-green-50 p-3 rounded-lg text-sm text-green-700">
              ✅ Selected: {selectedImage.name} (
              {(selectedImage.size / 1024).toFixed(1)} KB)
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
              placeholder="Enter ad name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target URL</label>
            <input
              type="url"
              value={formData.targetUrl}
              onChange={(e) =>
                setFormData({ ...formData, targetUrl: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date
              </label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Creating..." : "Create Ad"}
          </button>
        </form>
      </div>
    </div>
  );
}
