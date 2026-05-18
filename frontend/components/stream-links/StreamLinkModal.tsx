'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { StreamLink, CreateStreamLinkDto } from '@/types';
import { streamLinksAPI } from '@/lib/api/api';
import { ConfirmationDialog } from '@/components/ConfirmationDialog'; // Adjust path if needed

interface StreamLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StreamLink | null;
}

export function StreamLinkModal({ isOpen, onClose, initialData }: StreamLinkModalProps) {
  const [formData, setFormData] = useState<CreateStreamLinkDto>({
    title: '',
    url: '',
    description: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateStreamLinkDto>>({});
  
  // Success Dialog State
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Reset form
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        url: initialData.url,
        description: initialData.description || '',
        isActive: initialData.isActive,
      });
    } else {
      setFormData({ title: '', url: '', description: '', isActive: true });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateStreamLinkDto> = {};
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.url?.trim()) newErrors.url = 'URL is required';
    else if (!/^https?:\/\//.test(formData.url)) {
      newErrors.url = 'URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (initialData) {
        await streamLinksAPI.update(initialData._id, formData);
        setSuccessMessage('Stream link updated successfully!');
      } else {
        await streamLinksAPI.create(formData);
        setSuccessMessage('Stream link created successfully!');
      }

      setShowSuccessDialog(true);
      onClose(); // Close the form modal
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Failed to save stream link';
      alert(errorMsg); // Keep simple alert for errors (or you can make error dialog too)
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
  };

  if (!isOpen && !showSuccessDialog) return null;

  return (
    <>
      {/* Main Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {initialData ? 'Edit Stream Link' : 'Add New Stream Link'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Form fields remain the same */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Main Live Stream"
                  required
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stream URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                  required
                />
                {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional information..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 accent-blue-600"
                />
                <label htmlFor="isActive" className="font-medium text-gray-700 cursor-pointer">
                  Active (visible to users)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-70"
                >
                  {loading ? 'Saving...' : initialData ? 'Update Link' : 'Create Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      <ConfirmationDialog
        isOpen={showSuccessDialog}
        onClose={handleSuccessClose}
        onConfirm={handleSuccessClose}
        title="Success"
        message={successMessage}
        type="success"
        confirmText="Okay"
      />
    </>
  );
}