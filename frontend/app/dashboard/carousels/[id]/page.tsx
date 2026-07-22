"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { carouselsAPI } from "@/lib/api/api";

const getCarouselDeleteErrorMessage = (error: unknown) => {
  const apiError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return apiError.response?.data?.message || apiError.message || "Failed to delete";
};

interface Carousel {
  _id: string;
  name: string;
  image?: string;
  targetUrl?: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  displayOrder?: number;
}

export default function CarouselDetailPage() {
  const router = useRouter();
  const params = useParams();
  const carouselId = params.id as string;

  const [carousel, setCarousel] = useState<Carousel | null>(null);
  const [loading, setLoading] = useState(true);

  const mediaUrl =
    process.env.NEXT_PUBLIC_MEDIA_GET_URL || "https://api.radioyeraz.com";

  useEffect(() => {
    const fetchCarousel = async () => {
      try {
        const response = await carouselsAPI.getCarouselById(carouselId);
        setCarousel(response.data.data || response.data);
      } catch {
        toast.error("Failed to load carousel");
        router.push("/dashboard/carousels");
      } finally {
        setLoading(false);
      }
    };

    void fetchCarousel();
  }, [carouselId, router]);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete carousel?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    try {
      await carouselsAPI.deleteCarousel(carouselId);
      toast.success("Carousel deleted");
      router.push("/dashboard/carousels");
    } catch (error) {
      toast.error(getCarouselDeleteErrorMessage(error));
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!carousel) {
    return null;
  }

  const imageUrl =
    carousel.image && carousel.image !== "[object Object]"
      ? carousel.image.startsWith("http")
        ? carousel.image
        : `${mediaUrl}${carousel.image}`
      : undefined;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/carousels/${carouselId}/edit`}
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
          >
            <Pencil size={16} className="inline mr-1" />
            Edit
          </Link>

          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            <Trash2 size={16} className="inline mr-1" />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {imageUrl ? (
          <div className="relative w-full h-[400px] bg-gray-50">
            <Image
              src={imageUrl}
              alt={carousel.name}
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <ImageIcon size={64} className="text-gray-300" />
          </div>
        )}

        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{carousel.name}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-medium">Super Administrator</p>
            </div>

            {carousel.targetUrl && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Target URL</p>
                <a
                  href={carousel.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline break-all"
                >
                  {carousel.targetUrl.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-medium">
                {new Date(carousel.startDate).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-medium">
                {new Date(carousel.endDate).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">
                {carousel.isActive ? "Active" : "Inactive"}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Display Order</p>
              <p className="font-medium">{carousel.displayOrder ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
