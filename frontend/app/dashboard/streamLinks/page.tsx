'use client';

import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { StreamLinksGrid } from '@/components/stream-links/StreamLinksGrid';
import { StreamLinkModal } from '@/components/stream-links/StreamLinkModal';
import { ConfirmationDialog } from '@/components/ConfirmationDialog'; // Adjust path
import { StreamLink } from '@/types';
import { streamLinksAPI } from '@/lib/api/api';

export default function StreamLinksPage() {
  const [streamLinks, setStreamLinks] = useState<StreamLink[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<StreamLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<StreamLink | null>(null);

  // Delete Dialog State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  const fetchStreamLinks = async () => {
    setLoading(true);
    try {
      const { data } = await streamLinksAPI.getAll();
      setStreamLinks(data);
      setFilteredLinks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamLinks();
  }, []);

  // Filtering logic...
  useEffect(() => {
    let result = [...streamLinks];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(link =>
        link.title.toLowerCase().includes(term) ||
        link.url.toLowerCase().includes(term) ||
        link.description?.toLowerCase().includes(term)
      );
    }
    if (filter === 'active') result = result.filter(l => l.isActive);
    if (filter === 'inactive') result = result.filter(l => !l.isActive);
    setFilteredLinks(result);
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
      fetchStreamLinks();
      setSelectedLinks(prev => prev.filter(id => id !== linkToDelete));
    } catch (error) {
      console.error(error);
      alert('Failed to delete stream link');
    } finally {
      setShowDeleteDialog(false);
      setLinkToDelete(null);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingLink(null);
    fetchStreamLinks();
  };

  const total = streamLinks.length;
  const activeCount = streamLinks.filter(l => l.isActive).length;

  return (
    <div className="p-6 space-y-8">
      {/* Header, Stats, Search & Filter Bar (same as before) */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stream Links</h1>
          <p className="text-gray-600 mt-1">Manage your live streaming links</p>
        </div>
        <button
          onClick={() => { setEditingLink(null); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Stream Link
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <p className="text-gray-500 text-sm">Total Links</p>
          <p className="text-4xl font-bold mt-2">{total}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
          <p className="text-green-600 text-sm">Active</p>
          <p className="text-4xl font-bold text-green-700 mt-2">{activeCount}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <p className="text-red-600 text-sm">Inactive</p>
          <p className="text-4xl font-bold text-red-700 mt-2">{total - activeCount}</p>
        </div>
      </div>

      {/* Search and Filter Bar - same as before */}

      <StreamLinksGrid
        streamLinks={filteredLinks}
        onEdit={handleEdit}
        onDelete={openDeleteDialog}           // ← Changed to open dialog
        onSelectionChange={setSelectedLinks}
        loading={loading}
        selectedLinks={selectedLinks}
      />

      {/* Create/Edit Modal */}
      <StreamLinkModal
        isOpen={showModal}
        onClose={handleModalClose}
        initialData={editingLink}
      />

      {/* Beautiful Delete Confirmation Dialog */}
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