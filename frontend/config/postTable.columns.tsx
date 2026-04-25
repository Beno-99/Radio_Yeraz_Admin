import { Image as ImageIcon, Video, Eye, Pencil, Trash2 } from "lucide-react";
import type { Post } from "@/types";
import { format } from "date-fns";
import Swal from "sweetalert2";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import api from "@/lib/api/api";

export const getPostColumns = (
  API_URL: string,
  refetch: () => Promise<void>,
  router: AppRouterInstance,
) => [
  {
    key: "mainImage",
    header: "Image",
    render: (value: string, post: Post) => {
      const hasImage = value && value !== "/uploads/posts/undefined";

      return (
        <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {hasImage ? (
            <img
              src={`${API_URL}${value}`}
              className="h-full w-full object-cover"
            />
          ) : post.video ? (
            <Video className="h-6 w-6 text-blue-500" />
          ) : (
            <ImageIcon className="h-6 w-6 text-gray-400" />
          )}
        </div>
      );
    },
  },
  {
    key: "title",
    header: "Title",
    render: (v: string, p: Post) => (
      <>
        <div className="font-medium">{v}</div>
        <div className="text-sm text-gray-500 line-clamp-1">
          {p.description}
        </div>
      </>
    ),
  },
  {
    key: "postedDate",
    header: "Posted",
    render: (v: string) => format(new Date(v), "MMM d, yyyy"),
  },
  {
    key: "actions",
    header: "Actions",
    render: (_: unknown, post: Post) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push(`/dashboard/posts/${post._id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Eye className="h-4 w-4 text-gray-600" />
        </button>

        <button
          onClick={() => router.push(`/dashboard/posts/${post._id}/edit`)}
          className="p-2 hover:bg-blue-50 rounded-lg"
        >
          <Pencil className="h-4 w-4 text-blue-600" />
        </button>

        <button
          onClick={async () => {
            const res = await Swal.fire({
              title: `Are You Sure to Delete "${post.title}" Post ?`,
              text: post.title,
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#d33",
              confirmButtonText: "Delete",
            });

            if (!res.isConfirmed) return;

            await api.delete(`/posts/${post._id}`);
            await refetch();
            Swal.fire("Deleted!", "Post has been deleted.", "success");
          }}
          className="p-2 hover:bg-red-50 rounded-lg"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </button>
      </div>
    ),
  },
];
