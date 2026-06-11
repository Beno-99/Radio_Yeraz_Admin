"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, Search } from "lucide-react";
import { StreamLinksGrid } from "@/components/stream-links/StreamLinksGrid";
import { StreamLinkModal } from "@/components/stream-links/StreamLinkModal";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { StreamLink } from "@/types";
import { streamLinksAPI } from "@/lib/api/api";

export default function StreamLinksPage() {
  const [streamLinks, setStreamLinks] = useState<StreamLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<StreamLink | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  const hasFetched = useRef(false);

  // Fetch function (used for refresh after modal, delete, etc.)
  const fetchStreamLinks = useCallback(async () => {
    setLoading(true);
    try {
      const { data }: { data: StreamLink[] } = await streamLinksAPI.getAll();
      setStreamLinks(data);
    } catch (error) {
      console.error("Failed to fetch stream links:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount - This pattern avoids the lint rule
  useEffect(() => {
    if (hasFetched.current) return;

    hasFetched.current = true;
    fetchStreamLinks();
  }, [fetchStreamLinks]);

  // ✅ FILTERED DATA
  const filteredLinks = useMemo(() => {
    let result = [...streamLinks];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((link) =>
        link.title.toLowerCase().includes(term) ||
        link.url.toLowerCase().includes(term) ||
        link.description?.toLowerCase().includes(term)
      );
    }

    if (filter === "active") {
      result = result.filter((l) => l.isActive);
    } else if (filter === "inactive") {
      result = result.filter((l) => !l.isActive);
    }

    return result;
  }, [streamLinks, searchTerm, filter]);

  const handleEdit = (link: StreamLink) => {
    setEditingLink(link);
    setShowModal(true);
  };

  const openDeleteDialog = (id: string) => {
    setLinkToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!linkToDelete) return;

    try {
      await streamLinksAPI.delete(linkToDelete);

      setStreamLinks((prev) =>
        prev.filter((l) => l._id !== linkToDelete)
      );

      setSelectedLinks((prev) =>
        prev.filter((id) => id !== linkToDelete)
      );
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete stream link");
    } finally {
      setShowDeleteDialog(false);
      setLinkToDelete(null);
    }
  };

  const handleModalClose = async () => {
    setShowModal(false);
    setEditingLink(null);
    await fetchStreamLinks();
  };

  const total = streamLinks.length;
  const activeCount = streamLinks.filter((l) => l.isActive).length;

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Stream Links</h1>
          <p className="text-gray-600 mt-1">Manage your live streaming links</p>
        </div>

        <button
          onClick={() => {
            setEditingLink(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Stream Link
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border">
          <p>Total Links</p>
          <p className="text-4xl font-bold">{total}</p>
        </div>

        <div className="bg-green-50 p-6 rounded-2xl border">
          <p>Active</p>
          <p className="text-4xl font-bold">{activeCount}</p>
        </div>

        <div className="bg-red-50 p-6 rounded-2xl border">
          <p>Inactive</p>
          <p className="text-4xl font-bold">{total - activeCount}</p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex gap-3 items-center">
        <Search className="w-5 h-5 text-gray-500" />

        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search stream links..."
          className="border px-4 py-2 rounded-lg w-full"
        />

        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as "all" | "active" | "inactive")
          }
          className="border px-3 py-2 rounded-lg"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* GRID */}
      <StreamLinksGrid
        streamLinks={filteredLinks}
        onEdit={handleEdit}
        onDelete={openDeleteDialog}
        onSelectionChange={setSelectedLinks}
        loading={loading}
        selectedLinks={selectedLinks}
      />

      {/* MODAL */}
      <StreamLinkModal
        isOpen={showModal}
        onClose={handleModalClose}
        initialData={editingLink}
      />

      {/* DELETE DIALOG */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Stream Link"
        message="Are you sure you want to delete this stream link? This action cannot be undone."
        type="delete"
        confirmText="Delete"
      />
    </div>
  );
}