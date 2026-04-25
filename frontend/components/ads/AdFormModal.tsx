import { Ad } from "@/types";
import { FormBuilder } from "@/components/forms/FormBuilder";
import { adFormSchema, adFormFields } from "../../lib/utils/adFormSchema";

interface AdFormModalProps {
  isOpen: boolean;
  editingAd: Ad | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function AdFormModal({
  isOpen,
  editingAd,
  onClose,
  onSubmit,
}: AdFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
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
