import { Ad } from "@/types";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { adFormSchema, adFormFields } from "../../lib/utils/adFormSchema";

export interface AdFormData {
  title: string;
  description?: string;
  image?: string;
  videoUrl?: string;
  targetUrl?: string;
  advertiserName?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  platform?: "web" | "mobile" | "both";
  impressions?: number;
  clicks?: number;
}

interface AdFormModalProps {
  isOpen: boolean;
  editingAd: Ad | null;
  onClose: () => void;
  onSubmit: (data: AdFormData) => Promise<void>;
}

export default function AdFormModal({
  isOpen,
  editingAd,
  onClose,
  onSubmit,
}: AdFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {editingAd ? "Edit Ad Campaign" : "Create New Ad Campaign"}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <FormBuilder
          fields={adFormFields}
          onSubmit={onSubmit}
          onCancel={onClose}
          schema={adFormSchema}
          submitText={editingAd ? "Update Campaign" : "Create Campaign"}
          defaultValues={
            editingAd
              ? {
                  title: editingAd.title,
                  description: editingAd.description,
                  image: editingAd.image,
                  videoUrl: editingAd.videoUrl,
                  targetUrl: editingAd.targetUrl,
                  advertiserName: editingAd.advertiserName,
                  budget: editingAd.budget,
                  startDate: editingAd.startDate,
                  endDate: editingAd.endDate,
                  isActive: editingAd.isActive,
                  platform: editingAd.platform,
                  impressions: editingAd.impressions,
                  clicks: editingAd.clicks,
                }
              : {
                  platform: "both",
                  isActive: false,
                  impressions: 0,
                  clicks: 0,
                }
          }
          layout="grid"
        />
      </div>
    </div>
  );
}