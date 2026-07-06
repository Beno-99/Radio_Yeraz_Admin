import { Carousel } from "@/types";
import { FormBuilder } from "@/components/forms/FormBuilder";
import {
  carouselFormFields,
  carouselFormSchema,
} from "../../lib/utils/carouselFormSchema";

export interface CarouselFormData {
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

interface CarouselFormModalProps {
  isOpen: boolean;
  editingCarousel: Carousel | null;
  onClose: () => void;
  onSubmit: (data: CarouselFormData) => Promise<void>;
}

export default function CarouselFormModal({
  isOpen,
  editingCarousel,
  onClose,
  onSubmit,
}: CarouselFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-4 shadow-lg sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="break-words text-lg font-bold text-gray-900 sm:text-xl">
            {editingCarousel ? "Edit Carousel Campaign" : "Create New Carousel Campaign"}
          </h2>

          <button
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-lg text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <FormBuilder
          fields={carouselFormFields}
          onSubmit={onSubmit}
          onCancel={onClose}
          schema={carouselFormSchema}
          submitText={editingCarousel ? "Update Campaign" : "Create Campaign"}
          defaultValues={
            editingCarousel
              ? {
                  title: editingCarousel.title,
                  description: editingCarousel.description,
                  image: editingCarousel.image,
                  videoUrl: editingCarousel.videoUrl,
                  targetUrl: editingCarousel.targetUrl,
                  advertiserName: editingCarousel.advertiserName,
                  budget: editingCarousel.budget,
                  startDate: editingCarousel.startDate,
                  endDate: editingCarousel.endDate,
                  isActive: editingCarousel.isActive,
                  platform: editingCarousel.platform,
                  impressions: editingCarousel.impressions,
                  clicks: editingCarousel.clicks,
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
