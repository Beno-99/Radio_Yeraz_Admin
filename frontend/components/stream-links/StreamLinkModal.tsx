'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { StreamLink, CreateStreamLinkDto } from '@/types';
import { streamLinksAPI } from '@/lib/api/api';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { getLocalStorageValue } from '@/lib/browser-storage';

type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

interface StoredAdmin {
  _id?: string;
  id?: string;
  sub?: string;
  role?: string;
}

const normalizeAdminRole = (role?: string): AdminRole | undefined => {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return role;
  return undefined;
};

const getCurrentAdmin = () => {
  const rawUser = getLocalStorageValue('user');
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as StoredAdmin;

    return {
      id: user._id || user.id || user.sub,
      role: normalizeAdminRole(user.role),
    };
  } catch {
    return null;
  }
};

const getStreamLinkEditPermissionMessage = (streamLink: StreamLink | null | undefined) => {
  const currentAdmin = getCurrentAdmin();

  if (currentAdmin?.role !== 'ADMIN') return null;

  if (
    streamLink?.author?._id &&
    currentAdmin.id &&
    streamLink.author._id === currentAdmin.id
  ) {
    return null;
  }

  if (streamLink?.author?.role === 'SUPER_ADMIN') {
    return "You can't edit content created by a super admin.";
  }

  if (streamLink?.author?.role === 'ADMIN') {
    return "You can't edit a stream link created by another admin.";
  }

  return "You can't edit this stream link.";
};

interface StreamLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StreamLink | null;
}

export function StreamLinkModal({ isOpen, onClose, initialData }: StreamLinkModalProps) {
  const [formData, setFormData] = useState<CreateStreamLinkDto>({
    title: '',
    url: '',
    metadataUrl: '',
    description: '',
    bitrate: null,
    displayOrder: 0,
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateStreamLinkDto, string>>
  >({});
  
  // Success Dialog State
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fix: Use useMemo to compute initial form data without side effects
  const initialFormData = useMemo(() => {
    if (initialData) {
      return {
        title: initialData.title,
        url: initialData.url,
        metadataUrl: initialData.metadataUrl || '',
        description: initialData.description || '',
        bitrate: initialData.bitrate ?? null,
        displayOrder: initialData.displayOrder ?? 0,
        isActive: initialData.isActive,
      };
    }
    return {
      title: '',
      url: '',
      metadataUrl: '',
      description: '',
      bitrate: null,
      displayOrder: 0,
      isActive: true,
    };
  }, [initialData]);

  // Fix: Use setTimeout to avoid synchronous setState in useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      setFormData(initialFormData);
      setErrors({});
    }, 0);
    
    return () => clearTimeout(timer);
  }, [initialFormData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateStreamLinkDto, string>> = {};
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.url?.trim()) newErrors.url = 'URL is required';
    else if (!/^https?:\/\//.test(formData.url)) {
      newErrors.url = 'URL must start with http:// or https://';
    }
    if (
      formData.metadataUrl?.trim() &&
      !/^https?:\/\//.test(formData.metadataUrl)
    ) {
      newErrors.metadataUrl = 'Metadata URL must start with http:// or https://';
    }
    if (formData.bitrate !== null && formData.bitrate !== undefined) {
      if (!Number.isInteger(formData.bitrate) || formData.bitrate < 1 || formData.bitrate > 512) {
        newErrors.bitrate = 'Bitrate must be between 1 and 512';
      }
    }
    if (formData.displayOrder !== undefined) {
      if (!Number.isInteger(formData.displayOrder) || formData.displayOrder < 0) {
        newErrors.displayOrder = 'Order must be 0 or higher';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Define error type
  interface ApiError {
    response?: {
      data?: {
        message?: string;
      };
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const permissionMessage = initialData
      ? getStreamLinkEditPermissionMessage(initialData)
      : null;
    if (permissionMessage) {
      alert(permissionMessage);
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    const payload: CreateStreamLinkDto = {
      ...formData,
      title: formData.title.trim(),
      url: formData.url.trim(),
      metadataUrl: formData.metadataUrl?.trim() || null,
      description: formData.description?.trim() || undefined,
      bitrate: formData.bitrate ?? null,
      displayOrder: formData.displayOrder ?? 0,
    };

    try {
      if (initialData) {
        await streamLinksAPI.update(initialData._id, payload);
        setSuccessMessage('Stream link updated successfully!');
      } else {
        await streamLinksAPI.create(payload);
        setSuccessMessage('Stream link created successfully!');
      }

      setShowSuccessDialog(true);
      onClose(); // Close the form modal
    } catch (error: unknown) {
      console.error(error);
      const err = error as ApiError;
      const errorMsg = err.response?.data?.message || 'Failed to save stream link';
      alert(errorMsg); // Keep simple alert for errors
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = useCallback(() => {
    setShowSuccessDialog(false);
  }, []);

  if (!isOpen && !showSuccessDialog) return null;

  return (
    <>
      {/* Main Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
          <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
              <h2 className="break-words text-lg font-semibold text-gray-900 sm:text-xl">
                {initialData ? 'Edit Stream Link' : 'Add New Stream Link'}
              </h2>
              <button onClick={onClose} className="min-h-11 min-w-11 rounded-lg p-2 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:space-y-6 sm:p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="min-h-11 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                  required
                />
                {errors.url && <p className="text-red-500 text-sm mt-1">{errors.url}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metadata URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.metadataUrl ?? ''}
                  onChange={(e) => setFormData({ ...formData, metadataUrl: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://meta.radioyeraz.com/MetaData.txt"
                />
                {errors.metadataUrl && <p className="text-red-500 text-sm mt-1">{errors.metadataUrl}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional information..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitrate (kbps)</label>
                  <input
                    type="number"
                    min={1}
                    max={512}
                    step={1}
                    value={formData.bitrate ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bitrate: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    className="min-h-11 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="64"
                  />
                  {errors.bitrate && <p className="text-red-500 text-sm mt-1">{errors.bitrate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={formData.displayOrder ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }
                    className="min-h-11 w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  {errors.displayOrder && <p className="text-red-500 text-sm mt-1">{errors.displayOrder}</p>}
                </div>
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

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 flex-1 rounded-xl border border-gray-300 py-3 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-11 flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-70"
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
